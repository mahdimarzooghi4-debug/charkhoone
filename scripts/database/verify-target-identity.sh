#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_STAGING_MIGRATION_CONNECTION:?Npgsql staging migration connection is required}"
: "${CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION:?psql-compatible staging migration connection is required}"

for command_name in dotnet psql python3 sha256sum awk; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

output_dir="${CHARKHOONE_DATABASE_TARGET_IDENTITY_EVIDENCE_DIR:-artifacts/database/target-identity}"
mkdir -p "$output_dir"
umask 077

tmp_dir="$(mktemp -d)"
state_file="$tmp_dir/npgsql-state.txt"
release_file="$tmp_dir/release"
helper_log="$tmp_dir/npgsql-helper.log"
npgsql_evidence="$output_dir/npgsql-session.txt"
helper_pid=''

cleanup() {
  if [[ -n "$helper_pid" ]] && kill -0 "$helper_pid" >/dev/null 2>&1; then
    : > "$release_file"
    wait "$helper_pid" >/dev/null 2>&1 || true
  fi
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

hash_value() {
  printf '%s' "$1" | sha256sum | awk '{print $1}'
}

read_state() {
  local key=$1
  awk -F= -v key="$key" '$1 == key { print substr($0, length(key) + 2); exit }' "$state_file"
}

psql_scalar() {
  local sql=$1
  psql "$CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION" \
    -X -q -A -t -v ON_ERROR_STOP=1 -c "$sql"
}

lock_key="$(python3 - <<'PY'
import secrets
print(secrets.randbelow((1 << 62) - 1) + 1)
PY
)"

CHARKHOONE_DATABASE_TARGET_PROBE_CONNECTION="$CHARKHOONE_STAGING_MIGRATION_CONNECTION" \
  dotnet run \
    --project scripts/database/NpgsqlTargetProof/NpgsqlTargetProof.csproj \
    --configuration Release \
    --no-restore \
    -- "$lock_key" "$state_file" "$release_file" "$npgsql_evidence" \
    >"$helper_log" 2>&1 &
helper_pid=$!

for ((attempt = 0; attempt < 300; attempt++)); do
  [[ -s "$state_file" ]] && break
  if ! kill -0 "$helper_pid" >/dev/null 2>&1; then
    echo 'Npgsql target identity probe exited before establishing its advisory lock.' >&2
    exit 1
  fi
  sleep 0.1
done

[[ -s "$state_file" ]] || {
  echo 'Npgsql target identity probe did not become ready before timeout.' >&2
  exit 1
}

expected_database_hash="$(read_state database_sha256)"
expected_role_hash="$(read_state session_user_sha256)"
expected_endpoint_hash="$(read_state server_endpoint_sha256)"
[[ -n "$expected_database_hash" && -n "$expected_role_hash" && -n "$expected_endpoint_hash" ]] || {
  echo 'Npgsql target identity state is incomplete.' >&2
  exit 1
}

lock_observed="$(psql_scalar "SELECT NOT pg_try_advisory_lock($lock_key)")"
if [[ "$lock_observed" != t ]]; then
  echo 'Npgsql and psql migration connections do not resolve to the same PostgreSQL database lock namespace.' >&2
  exit 1
fi

psql_database="$(psql_scalar 'SELECT current_database()')"
psql_role="$(psql_scalar 'SELECT session_user')"
psql_endpoint="$(psql_scalar "SELECT COALESCE(inet_server_addr()::text, '') || ':' || COALESCE(inet_server_port()::text, '')")"
psql_server_version="$(psql_scalar "SELECT current_setting('server_version_num')")"

psql_database_hash="$(hash_value "$psql_database")"
psql_role_hash="$(hash_value "$psql_role")"
psql_endpoint_hash="$(hash_value "$psql_endpoint")"

if [[ "$psql_database_hash" != "$expected_database_hash" ]]; then
  echo 'Npgsql and psql migration connections resolved to different database identities.' >&2
  exit 1
fi
if [[ "$psql_role_hash" != "$expected_role_hash" ]]; then
  echo 'Npgsql and psql migration connections resolved to different migration roles.' >&2
  exit 1
fi

cat > "$output_dir/psql-session.txt" <<EOF
proof_version=1
driver=psql
database_sha256=$psql_database_hash
session_user_sha256=$psql_role_hash
server_endpoint_sha256=$psql_endpoint_hash
server_version_num=$psql_server_version
npgsql_advisory_lock_observed=true
connection_secret=not-recorded
EOF

: > "$release_file"
if ! wait "$helper_pid"; then
  helper_pid=''
  echo 'Npgsql target identity probe failed while releasing its advisory lock.' >&2
  exit 1
fi
helper_pid=''

cat > "$output_dir/summary.txt" <<EOF
proof_version=1
npgsql_psql_target_binding=passed
advisory_lock_namespace_match=true
database_identity_hash_match=true
migration_role_identity_hash_match=true
npgsql_server_endpoint_sha256=$expected_endpoint_hash
psql_server_endpoint_sha256=$psql_endpoint_hash
connection_secrets=not-recorded
staging_production_execution=not-claimed-by-verifier
EOF

printf 'Npgsql/psql migration target identity binding verified. Evidence: %s\n' "$output_dir"
printf 'Connection strings, database names, and role names were not printed or recorded.\n'
