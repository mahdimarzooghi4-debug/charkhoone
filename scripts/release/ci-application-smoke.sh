#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

for command_name in git python3 curl; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

sha="$(git rev-parse HEAD)"
contract_id='11111111-2222-3333-4444-555555555555'
fixture_root="$(mktemp -d)"
server_pid=''
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
  rm -rf "$fixture_root"
}
trap cleanup EXIT

mkdir -p "$fixture_root/database"
cat > "$fixture_root/database/summary.txt" <<EOF
environment=ci
git_sha=$sha
migration_runtime_roles_distinct=true
migration_runtime_database_name_match=true
pre_migration_runtime_role=passed
provider_backup_evidence=operator-supplied-hash-recorded
provider_restore_evidence=operator-supplied-hash-recorded
migration=completed
post_migration_readiness=passed
query_plan_evidence=captured-on-operator-confirmed-representative-dataset
promotion_decision=not-made-by-script
EOF
for name in provider-backup-evidence.sha256 provider-restore-evidence.sha256 migrations-idempotent.sha256 migrations-after.txt; do
  printf 'ci-fixture-only\n' > "$fixture_root/database/$name"
done
printf 'api_release_sha=%s\n' "$sha" > "$fixture_root/api-release.txt"
printf 'worker_release_sha=%s\n' "$sha" > "$fixture_root/worker-release.txt"

cat > "$fixture_root/server.py" <<'PY'
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

contract_id = sys.argv[1]
port_file = sys.argv[2]
expected_auth = "Bearer ci-smoke-token"

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def send_json(self, status, payload):
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self):
        parsed = urlsplit(self.path)
        path = parsed.path
        if path in {"/health/live", "/health/ready"}:
            body = b"Healthy"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path == "/api/v1":
            self.send_json(200, {"service": "Charkhoone.Api", "apiVersion": "v1", "status": "ready"})
            return
        contract_path = f"/api/v1/contracts/{contract_id}"
        if path in {contract_path, f"{contract_path}/audit-events"}:
            if self.headers.get("Authorization") != expected_auth:
                self.send_json(401, {"title": "Unauthorized"})
                return
            if path == contract_path:
                self.send_json(200, {
                    "contractId": contract_id,
                    "monthlyObligations": [],
                    "paymentsRequiringReconciliation": []
                })
            else:
                self.send_json(200, {
                    "items": [], "page": 1, "pageSize": 1, "totalCount": 0, "hasNextPage": False
                })
            return
        self.send_json(404, {"title": "Not Found"})

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
with open(port_file, "w", encoding="utf-8") as handle:
    handle.write(str(server.server_address[1]))
server.serve_forever()
PY

port_file="$fixture_root/port"
python3 "$fixture_root/server.py" "$contract_id" "$port_file" &
server_pid=$!
for _ in $(seq 1 50); do
  [[ -s "$port_file" ]] && break
  sleep 0.1
done
[[ -s "$port_file" ]] || { echo 'CI smoke fixture server did not start.' >&2; exit 1; }
port="$(cat "$port_file")"

CHARKHOONE_APPLICATION_SMOKE_ENVIRONMENT=ci \
CHARKHOONE_ALLOW_APPLICATION_SMOKE_COMPATIBILITY=true \
CHARKHOONE_STAGING_API_BASE_URL="http://127.0.0.1:$port" \
CHARKHOONE_STAGING_API_BEARER_TOKEN='ci-smoke-token' \
CHARKHOONE_STAGING_SMOKE_CONTRACT_ID="$contract_id" \
CHARKHOONE_EXPECTED_GIT_SHA="$sha" \
CHARKHOONE_STAGING_DATABASE_REHEARSAL_DIR="$fixture_root/database" \
CHARKHOONE_STAGING_API_RELEASE_EVIDENCE="$fixture_root/api-release.txt" \
CHARKHOONE_STAGING_WORKER_RELEASE_EVIDENCE="$fixture_root/worker-release.txt" \
CHARKHOONE_APPLICATION_EVIDENCE_DIR="${CHARKHOONE_APPLICATION_EVIDENCE_DIR:-artifacts/release/application-smoke}" \
bash scripts/release/staging-application-smoke.sh

summary="${CHARKHOONE_APPLICATION_EVIDENCE_DIR:-artifacts/release/application-smoke}/ci/$sha/summary.txt"
grep -Fxq 'environment=ci' "$summary"
grep -Fxq 'response_bodies_persisted=false' "$summary"
grep -Fxq 'promotion_decision=not-made-by-script' "$summary"
printf 'CI application-smoke compatibility contract passed for %s\n' "$sha"
