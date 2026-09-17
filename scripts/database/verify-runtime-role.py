"""Validate the application-role least-privilege audit contract."""
from __future__ import annotations

import pathlib
import sys

EXPECTED = {
    "application_function_owner",
    "application_table_owner",
    "application_table_trigger_privilege",
    "application_table_truncate_privilege",
    "database_create_privilege",
    "database_owner",
    "public_schema_create_privilege",
    "public_schema_owner",
    "role_bypass_rls",
    "role_create_db",
    "role_create_role",
    "role_replication",
    "role_superuser",
}


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: verify-runtime-role.py <audit.tsv>")

    path = pathlib.Path(sys.argv[1])
    if not path.is_file() or path.stat().st_size == 0:
        raise SystemExit("runtime role audit output is missing or empty")

    seen: dict[str, int] = {}
    for line_number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not raw.strip():
            continue
        parts = raw.split("\t")
        if len(parts) != 2:
            raise SystemExit(f"malformed runtime-role row at line {line_number}")
        code, count_text = parts
        if code not in EXPECTED:
            raise SystemExit(f"unexpected runtime-role check code: {code}")
        if code in seen:
            raise SystemExit(f"duplicate runtime-role check code: {code}")
        try:
            count = int(count_text)
        except ValueError as exc:
            raise SystemExit(f"non-integer violation count for {code}") from exc
        if count < 0:
            raise SystemExit(f"negative violation count for {code}")
        seen[code] = count

    missing = EXPECTED.difference(seen)
    if missing:
        raise SystemExit(f"missing runtime-role checks: {', '.join(sorted(missing))}")

    failures = {code: count for code, count in seen.items() if count != 0}
    if failures:
        detail = ", ".join(f"{code}={count}" for code, count in sorted(failures.items()))
        raise SystemExit(f"runtime role is over-privileged: {detail}")

    print("runtime role audit passed: all 13 least-privilege checks are zero")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
