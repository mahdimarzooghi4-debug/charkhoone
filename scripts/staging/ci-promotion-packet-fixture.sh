#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

for command_name in git mktemp mkdir rm sha256sum grep wc awk tr; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

expected_sha="$(git rev-parse HEAD | tr '[:upper:]' '[:lower:]')"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

application_dir="$temp_dir/application-smoke"
database_summary="$temp_dir/database-summary.txt"
worker_evidence="$temp_dir/worker-deployment.txt"
ci_evidence="$temp_dir/ci-evidence.txt"
packet_root="$temp_dir/promotion-packet"
mkdir -p "$application_dir"

cat > "$database_summary" <<EOF
environment=staging
git_sha=$expected_sha
migration_runtime_roles_distinct=true
migration_runtime_database_name_match=true
provider_backup_evidence=operator-supplied-hash-recorded
provider_restore_evidence=operator-supplied-hash-recorded
migration=completed
post_migration_readiness=passed
query_plan_evidence=captured-on-operator-confirmed-representative-dataset
promotion_decision=not-made-by-script
EOF

cat > "$application_dir/summary.txt" <<EOF
environment=staging
git_sha=$expected_sha
smoke_runner_git_sha=matched
api_release_header=matched
api_liveness=passed
api_readiness=passed
anonymous_contract_auth_boundary=401
authenticated_contract_read=passed
authenticated_contract_audit_read=passed
database_rehearsal=matched-release-and-passed
worker_release_sha=matched-operator-platform-evidence
worker_health_probe=not-available-worker-has-no-http-health-surface
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
EOF

printf 'provider=fixture\ngit_sha=%s\nstatus=deployed\n' "$expected_sha" > "$worker_evidence"
printf '%s\n' "$(sha256sum "$database_summary" | awk '{print $1}')" > "$application_dir/database-rehearsal-summary.sha256"
printf '%s\n' "$(sha256sum "$worker_evidence" | awk '{print $1}')" > "$application_dir/worker-deployment-evidence.sha256"

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
  CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE="$worker_evidence" \
  CHARKHOONE_RELEASE_CI_EVIDENCE="$ci_evidence" \
  CHARKHOONE_ALLOW_STAGING_PROMOTION_PACKET=true \
  CHARKHOONE_STAGING_PROMOTION_PACKET_DIR="$packet_root" \
  scripts/staging/build-promotion-packet.sh
}

run_packet >/dev/null
output_dir="$packet_root/$expected_sha"
test -s "$output_dir/evidence-manifest.tsv"
test -s "$output_dir/promotion-readiness.txt"
grep -Fxq "git_sha=$expected_sha" "$output_dir/promotion-readiness.txt"
grep -Fxq 'database_rehearsal_hash_binding=matched' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_deployment_evidence_hash_binding=matched' "$output_dir/promotion-readiness.txt"
grep -Fxq 'worker_health=not-proven-no-http-health-surface' "$output_dir/promotion-readiness.txt"
grep -Fxq 'promotion_decision=human-required' "$output_dir/promotion-readiness.txt"
grep -Fxq 'deployment_action=none' "$output_dir/promotion-readiness.txt"
[[ "$(wc -l < "$output_dir/evidence-manifest.tsv")" -eq 8 ]]

printf '\ntampered-after-smoke=true\n' >> "$worker_evidence"
if run_packet >/dev/null 2>&1; then
  echo 'Promotion packet unexpectedly accepted worker evidence that changed after application smoke.' >&2
  exit 1
fi

printf 'Promotion packet fixture tests passed.\n'
