#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

for command_name in git mktemp mkdir rm sha256sum grep wc awk tr cp mv python3; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

expected_sha="$(git rev-parse HEAD | tr '[:upper:]' '[:lower:]')"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

application_dir="$temp_dir/application-smoke"
database_summary="$temp_dir/database-summary.txt"
broker_evidence="$temp_dir/message-broker.txt"
broker_metadata="$temp_dir/message-broker-metadata.json"
worker_evidence="$temp_dir/worker-deployment.txt"
worker_metadata="$temp_dir/worker-deployment-metadata.json"
target_manifest="$temp_dir/staging-target.json"
ci_evidence="$temp_dir/ci-evidence.txt"
packet_root="$temp_dir/promotion-packet"
mkdir -p "$application_dir"

cat > "$target_manifest" <<'EOF'
{
  "schema_version": 1,
  "environment": "staging",
  "database": {
    "provider": "fixture-db",
    "scope_id": "workspace-a",
    "resource_id": "postgres-a",
    "database_name": "charkhoone_staging"
  },
  "message_broker": {
    "provider": "fixture-mq",
    "scope_id": "workspace-a",
    "resource_id": "rabbitmq-a"
  },
  "api": {
    "provider": "fixture-compute",
    "scope_id": "workspace-a",
    "resource_id": "api-a",
    "base_url": "https://api.invalid"
  },
  "worker": {
    "provider": "fixture-compute",
    "scope_id": "workspace-a",
    "resource_id": "worker-a",
    "health_url": "https://worker.invalid/health/live"
  }
}
EOF

target_hash="$(python3 scripts/staging/verify-target-manifest.py "$target_manifest" | awk -F= '$1 == "staging_target_binding_sha256" { print $2; exit }')"
[[ "$target_hash" =~ ^[0-9a-f]{64}$ ]]

cat > "$database_summary" <<EOF
environment=staging
git_sha=$expected_sha
staging_target_binding_sha256=$target_hash
staging_target_database_name_match=true
migration_runtime_roles_distinct=true
migration_runtime_database_name_match=true
provider_backup_evidence=identity-and-raw-hash-verified
provider_backup_raw_sha256=$(printf 'fixture-backup' | sha256sum | awk '{print $1}')
provider_backup_metadata_sha256=$(printf 'fixture-backup-meta' | sha256sum | awk '{print $1}')
provider_restore_evidence=identity-and-raw-hash-verified
provider_restore_raw_sha256=$(printf 'fixture-restore' | sha256sum | awk '{print $1}')
provider_restore_metadata_sha256=$(printf 'fixture-restore-meta' | sha256sum | awk '{print $1}')
migration=completed
post_migration_readiness=passed
query_plan_evidence=captured-on-operator-confirmed-representative-dataset
promotion_decision=not-made-by-script
EOF

cat > "$application_dir/summary.txt" <<EOF
environment=staging
git_sha=$expected_sha
staging_target_binding_sha256=$target_hash
staging_target_api_url=matched
staging_target_worker_health_url=matched
smoke_runner_git_sha=matched
api_release_header=matched
api_liveness=passed
api_readiness=passed
anonymous_contract_auth_boundary=401
authenticated_contract_read=passed
authenticated_contract_audit_read=passed
database_rehearsal=matched-release-and-passed
message_broker_evidence=identity-and-raw-hash-verified
message_broker_metadata=hash-recorded
worker_release_sha=matched-operator-platform-evidence
worker_http_release_header=matched
worker_http_liveness=passed
worker_http_readiness=passed
worker_http_identity=matched
worker_deployment_evidence=identity-and-raw-hash-verified
worker_deployment_metadata=hash-recorded
financial_mutations=not-exercised
response_bodies=not-retained
access_token=not-retained
promotion_decision=not-made-by-script
EOF

cat > "$application_dir/http-statuses.txt" <<'EOF'
api_root=200
health_live=200
health_ready=200
anonymous_contract=401
authenticated_contract=200
authenticated_audit=200
worker_health_live=200
worker_health_ready=200
EOF

printf 'provider=fixture-mq\nstatus=available\n' > "$broker_evidence"
broker_raw_hash="$(sha256sum "$broker_evidence" | awk '{print $1}')"
cat > "$broker_metadata" <<EOF
{
  "schema_version": 1,
  "environment": "staging",
  "evidence_kind": "message-broker-deployment",
  "staging_target_binding_sha256": "$target_hash",
  "provider": "fixture-mq",
  "scope_id": "workspace-a",
  "resource_id": "rabbitmq-a",
  "raw_evidence_sha256": "$broker_raw_hash"
}
EOF

python3 scripts/staging/verify-provider-evidence.py \
  --manifest "$target_manifest" \
  --metadata "$broker_metadata" \
  --raw-evidence "$broker_evidence" \
  --kind message-broker-deployment >/dev/null

printf 'provider=fixture\ngit_sha=%s\nstatus=deployed\n' "$expected_sha" > "$worker_evidence"
worker_raw_hash="$(sha256sum "$worker_evidence" | awk '{print $1}')"
cat > "$worker_metadata" <<EOF
{
  "schema_version": 1,
  "environment": "staging",
  "evidence_kind": "worker-deployment",
  "staging_target_binding_sha256": "$target_hash",
  "provider": "fixture-compute",
  "scope_id": "workspace-a",
  "resource_id": "worker-a",
  "raw_evidence_sha256": "$worker_raw_hash",
  "git_sha": "$expected_sha"
}
EOF

python3 scripts/staging/verify-provider-evidence.py \
  --manifest "$target_manifest" \
  --metadata "$worker_metadata" \
  --raw-evidence "$worker_evidence" \
  --kind worker-deployment \
  --expected-git-sha "$expected_sha" >/dev/null

printf '%s\n' "$(sha256sum "$database_summary" | awk '{print $1}')" > "$application_dir/database-rehearsal-summary.sha256"
printf '%s\n' "$broker_raw_hash" > "$application_dir/message-broker-evidence.sha256"
printf '%s\n' "$(sha256sum "$broker_metadata" | awk '{print $1}')" > "$application_dir/message-broker-evidence-metadata.sha256"
printf '%s\n' "$worker_raw_hash" > "$application_dir/worker-deployment-evidence.sha256"
printf '%s\n' "$(sha256sum "$worker_metadata" | awk '{print $1}')" > "$application_dir/worker-deployment-evidence-metadata.sha256"
printf '%s\n' "$target_hash" > "$application_dir/staging-target-binding.sha256"

cat > "$ci_evidence" <<EOF
environment=ci
git_sha=$expected_sha
workflow=ci
conclusion=success
backend=success
web=success
mobile_typecheck=success
mobile_build=not-claimed
EOF

run_packet() {
  CHARKHOONE_EXPECTED_GIT_SHA="$expected_sha" \
  CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY="$database_summary" \
  CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR="$application_dir" \
  CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE="$broker_evidence" \
  CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA="$broker_metadata" \
  CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE="$worker_evidence" \
  CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA="$worker_metadata" \
  CHARKHOONE_STAGING_TARGET_MANIFEST="$target_manifest" \
  CHARKHOONE_RELEASE_CI_EVIDENCE="$ci_evidence" \
  CHARKHOONE_ALLOW_STAGING_PROMOTION_PACKET=true \
  CHARKHOONE_STAGING_PROMOTION_PACKET_DIR="$packet_root" \
  bash scripts/staging/build-promotion-packet.sh
}

run_packet >/dev/null
output_dir="$packet_root/$expected_sha"
test -s "$output_dir/evidence-manifest.tsv"
test -s "$output_dir/promotion-readiness.txt"
grep -Fxq "git_sha=$expected_sha" "$output_dir/promotion-readiness.txt"
grep -Fxq 'database_rehearsal_hash_binding=matched' "$output_dir/promotion-readiness.txt"
grep -Fxq 'database_provider_evidence_hashes=validated' "$output_dir/promotion-readiness.txt"
grep -Fxq 'message_broker_evidence_hash_binding=matched' "$output_dir/promotion-readiness.txt"
grep -Fxq 'message_broker_metadata_hash_binding=matched' "$output_dir/promotion-readiness.txt"
grep -Fxq 'message_broker_provider_identity=matched-target-manifest' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_deployment_evidence_hash_binding=matched' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_deployment_metadata_hash_binding=matched' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_provider_identity=matched-target-manifest' "$output_dir/promotion-readiness.txt"
grep -Fxq 'staging_target_binding=matched-across-database-and-application' "$output_dir/promotion-readiness.txt"
grep -Fxq "staging_target_binding_sha256=$target_hash" "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_http_release_header=validated' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_http_liveness=validated' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_http_readiness=validated' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_http_identity=validated' "$output_dir/promotion-readiness.txt"
grep -Fxq 'promotion_decision=human-required' "$output_dir/promotion-readiness.txt"
grep -Fxq 'deployment_action=none' "$output_dir/promotion-readiness.txt"
[[ "$(wc -l < "$output_dir/evidence-manifest.tsv")" -eq 15 ]]

cp "$application_dir/summary.txt" "$application_dir/summary.valid.txt"
grep -v '^worker_http_liveness=passed$' "$application_dir/summary.valid.txt" > "$application_dir/summary.txt"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted application evidence without Worker HTTP liveness proof.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]
mv "$application_dir/summary.valid.txt" "$application_dir/summary.txt"

cp "$application_dir/summary.txt" "$application_dir/summary.readiness-valid.txt"
grep -v '^worker_http_readiness=passed$' "$application_dir/summary.readiness-valid.txt" > "$application_dir/summary.txt"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted application evidence without Worker HTTP readiness proof.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]
mv "$application_dir/summary.readiness-valid.txt" "$application_dir/summary.txt"

cp "$application_dir/summary.txt" "$application_dir/summary.target-valid.txt"
wrong_target_hash='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
sed "s/^staging_target_binding_sha256=.*/staging_target_binding_sha256=$wrong_target_hash/" "$application_dir/summary.target-valid.txt" > "$application_dir/summary.txt"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted mismatched staging target identity.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]
mv "$application_dir/summary.target-valid.txt" "$application_dir/summary.txt"

run_packet >/dev/null
exec {fixture_lock_fd}>"$application_dir/.evidence.lock"
flock --exclusive "$fixture_lock_fd"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly read evidence while a writer held its lock.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]
exec {fixture_lock_fd}>&-
run_packet >/dev/null

printf '\ntampered-broker-after-smoke=true\n' >> "$broker_evidence"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted message broker evidence that changed after application smoke.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]

printf 'provider=fixture-mq\nstatus=available\n' > "$broker_evidence"
printf '\n' >> "$broker_metadata"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted message broker metadata bytes that changed after application smoke.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]

cat > "$broker_metadata" <<EOF
{
  "schema_version": 1,
  "environment": "staging",
  "evidence_kind": "message-broker-deployment",
  "staging_target_binding_sha256": "$target_hash",
  "provider": "fixture-mq",
  "scope_id": "workspace-a",
  "resource_id": "rabbitmq-a",
  "raw_evidence_sha256": "$(sha256sum "$broker_evidence" | awk '{print $1}')"
}
EOF

printf '\ntampered-after-smoke=true\n' >> "$worker_evidence"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted worker evidence that changed after application smoke.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]

printf 'provider=fixture\ngit_sha=%s\nstatus=deployed\n' "$expected_sha" > "$worker_evidence"
printf '\n' >> "$worker_metadata"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted worker metadata bytes that changed after application smoke.' >&2
  exit 1
fi
[[ ! -e "$output_dir/promotion-readiness.txt" ]]

printf 'Promotion packet fixture tests passed.\n'
