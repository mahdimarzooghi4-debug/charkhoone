#!/usr/bin/env python3
import os
import re
import sys
from urllib.parse import urlsplit

PREFIX = "charkhoone_pilot_"
BLOCKED = {
    "postgres",
    "charkhoone",
    "charkhoone_integration",
    "charkhoone_restore_drill",
}

def database_name(connection: str) -> str:
    raw = connection.strip()
    if not raw:
        raise ValueError("CHARKHOONE_PILOT_POSTGRES is required.")

    if raw.lower().startswith(("postgres://", "postgresql://")):
        parsed = urlsplit(raw)
        name = parsed.path.lstrip("/").strip()
        if not name:
            raise ValueError("Pilot PostgreSQL URI must include a database name.")
        return name

    values = {}
    for part in raw.split(";"):
        if not part.strip():
            continue
        if "=" not in part:
            raise ValueError("Pilot PostgreSQL connection string contains a malformed segment.")
        key, value = part.split("=", 1)
        values[key.strip().lower()] = value.strip()

    name = values.get("database") or values.get("initial catalog")
    if not name:
        raise ValueError("Pilot PostgreSQL connection string must include Database.")
    return name

def verify(connection: str, confirmation: str) -> str:
    name = database_name(connection)
    if name.lower() in BLOCKED:
        raise ValueError(f"Refusing protected/non-pilot database: {name}")
    if not name.lower().startswith(PREFIX):
        raise ValueError(
            f"Pilot cohort database name must start with {PREFIX!r}; received {name!r}.")
    if not re.fullmatch(r"[A-Za-z0-9_\-]{1,128}", name):
        raise ValueError("Pilot cohort database name contains unsupported characters.")
    if confirmation.strip() != name:
        raise ValueError(
            "CHARKHOONE_PILOT_DATABASE_CONFIRMATION must exactly equal the target database name.")
    return name

def main() -> int:
    try:
        name = verify(
            os.environ.get("CHARKHOONE_PILOT_POSTGRES", ""),
            os.environ.get("CHARKHOONE_PILOT_DATABASE_CONFIRMATION", ""))
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"pilot_database_name={name}")
    print("pilot_database_guard=passed")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
