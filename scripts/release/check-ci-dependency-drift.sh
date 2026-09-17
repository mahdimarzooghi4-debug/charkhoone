#!/usr/bin/env bash
set -euo pipefail

output_dir="${1:-artifacts/ci-dependency-drift}"
current_lock="deploy/ci-dependencies.lock"
resolved_lock="${output_dir}/resolved-ci-dependencies.lock"
summary_file="${output_dir}/summary.txt"
changes_file="${output_dir}/changes.tsv"
diff_file="${output_dir}/diff.txt"
resolver_stdout="${output_dir}/resolver-output.txt"
resolver_stderr="${output_dir}/resolver-error.txt"

mkdir -p "$output_dir"
: > "$changes_file"
: > "$diff_file"
: > "$resolver_stdout"
: > "$resolver_stderr"

generated_utc="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
current_sha256="$(sha256sum "$current_lock" | awk '{print $1}')"

if ! bash scripts/release/resolve-ci-dependencies.sh "$resolved_lock" >"$resolver_stdout" 2>"$resolver_stderr"; then
  cat > "$summary_file" <<EOF
schema_version=1
generated_utc=${generated_utc}
check_status=resolution-failed
drift_detected=unknown
current_lock_sha256=${current_sha256}
resolved_lock_sha256=unavailable
repository_mutation=not-performed
promotion_decision=not-made-by-script
EOF
  echo "CI dependency resolution failed; see resolver evidence." >&2
  exit 2
fi

resolved_sha256="$(sha256sum "$resolved_lock" | awk '{print $1}')"

python3 - "$current_lock" "$resolved_lock" "$changes_file" <<'PY'
from pathlib import Path
import sys

current_path, resolved_path, output_path = map(Path, sys.argv[1:])

def load(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        key, value = line.split("=", 1)
        result[key] = value
    return result

current = load(current_path)
resolved = load(resolved_path)
keys = sorted(set(current) | set(resolved))
with output_path.open("w", encoding="utf-8") as handle:
    handle.write("key\tcurrent_ref\tresolved_ref\n")
    for key in keys:
        if current.get(key) != resolved.get(key):
            handle.write(f"{key}\t{current.get(key, 'missing')}\t{resolved.get(key, 'missing')}\n")
PY

if cmp -s "$current_lock" "$resolved_lock"; then
  cat > "$summary_file" <<EOF
schema_version=1
generated_utc=${generated_utc}
check_status=passed
drift_detected=no
current_lock_sha256=${current_sha256}
resolved_lock_sha256=${resolved_sha256}
repository_mutation=not-performed
promotion_decision=not-made-by-script
EOF
  echo "ci-dependency-drift=none"
  exit 0
fi

diff -u "$current_lock" "$resolved_lock" > "$diff_file" || true
cat > "$summary_file" <<EOF
schema_version=1
generated_utc=${generated_utc}
check_status=drift-detected
drift_detected=yes
current_lock_sha256=${current_sha256}
resolved_lock_sha256=${resolved_sha256}
repository_mutation=not-performed
promotion_decision=not-made-by-script
EOF

echo "CI dependency drift detected. Review and update the synchronized lock/workflow pins together." >&2
exit 1
