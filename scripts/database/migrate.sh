#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

: "${CHARKHOONE_DATABASE_CONNECTION:?CHARKHOONE_DATABASE_CONNECTION is required}"
: "${CHARKHOONE_DATABASE_ENVIRONMENT:?CHARKHOONE_DATABASE_ENVIRONMENT is required (staging or production)}"
: "${CHARKHOONE_ALLOW_DATABASE_MIGRATION:?Set CHARKHOONE_ALLOW_DATABASE_MIGRATION=true after reviewing the migration plan}"

case "$CHARKHOONE_DATABASE_ENVIRONMENT" in
  staging|production) ;;
  *)
    echo "CHARKHOONE_DATABASE_ENVIRONMENT must be staging or production." >&2
    exit 1
    ;;
esac

if [[ "$CHARKHOONE_ALLOW_DATABASE_MIGRATION" != "true" ]]; then
  echo "Migration execution is blocked unless CHARKHOONE_ALLOW_DATABASE_MIGRATION=true." >&2
  exit 1
fi

if [[ "$CHARKHOONE_DATABASE_ENVIRONMENT" == "production" && "${CHARKHOONE_CONFIRM_PRODUCTION_MIGRATION:-}" != "I_HAVE_REVIEWED_BACKUP_AND_MIGRATION_PLAN" ]]; then
  echo "Production migration requires CHARKHOONE_CONFIRM_PRODUCTION_MIGRATION=I_HAVE_REVIEWED_BACKUP_AND_MIGRATION_PLAN." >&2
  exit 1
fi

command -v dotnet >/dev/null 2>&1 || {
  echo "dotnet is required." >&2
  exit 1
}

if ! command -v dotnet-ef >/dev/null 2>&1; then
  echo "dotnet-ef must be installed explicitly before running migrations." >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "Applying checked-in EF Core migrations to ${CHARKHOONE_DATABASE_ENVIRONMENT}."
echo "The connection string is intentionally not printed."

dotnet ef database update \
  --project src/Charkhoone.Infrastructure/Charkhoone.Infrastructure.csproj \
  --startup-project src/Charkhoone.Api/Charkhoone.Api.csproj \
  --connection "$CHARKHOONE_DATABASE_CONNECTION"

echo "Migration command completed. Run application-level smoke tests and database verification before promotion."
