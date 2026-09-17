#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
expected_node="v22.13.1"
expected_npm="10.9.2"

if [[ "$(node --version)" != "$expected_node" ]]; then
  echo "expected Node ${expected_node}; got $(node --version)" >&2
  exit 1
fi
if [[ "$(npm --version)" != "$expected_npm" ]]; then
  echo "expected npm ${expected_npm}; got $(npm --version)" >&2
  exit 1
fi

for app in web mobile; do
  echo "Resolving apps/${app}/package-lock.json with Node ${expected_node} / npm ${expected_npm}"
  pushd "${repo_root}/apps/${app}" >/dev/null
  npm install --package-lock-only --ignore-scripts --no-audit --no-fund
  npm ci --no-audit --no-fund
  npm run typecheck
  popd >/dev/null
done

python3 "${repo_root}/scripts/release/verify-node-dependency-locks.py"
