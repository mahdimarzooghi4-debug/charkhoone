#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_PATH="${1:-$ROOT_DIR/artifacts/database/migrations-idempotent.sql}"

mkdir -p "$(dirname "$OUTPUT_PATH")"

command -v dotnet >/dev/null 2>&1 || {
  echo "dotnet is required." >&2
  exit 1
}

if ! command -v dotnet-ef >/dev/null 2>&1; then
  echo "dotnet-ef must be installed explicitly before generating migration SQL." >&2
  exit 1
fi

cd "$ROOT_DIR"

dotnet ef migrations script --idempotent \
  --project src/Charkhoone.Infrastructure/Charkhoone.Infrastructure.csproj \
  --startup-project src/Charkhoone.Api/Charkhoone.Api.csproj \
  --output "$OUTPUT_PATH"

test -s "$OUTPUT_PATH"
grep -q '__EFMigrationsHistory' "$OUTPUT_PATH"

echo "Generated idempotent migration SQL at $OUTPUT_PATH"
