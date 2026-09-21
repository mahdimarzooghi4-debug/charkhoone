#!/usr/bin/env python3
"""Vendor the exact Figma MOCK preview assets as offline TS data URIs.

Run once on a machine with access to www.figma.com:
    python scripts/release/vendor-mobile-figma-assets.py
    python scripts/release/vendor-mobile-figma-assets.py --check

The Figma MCP asset links in the source manifest are short-lived DOWNLOAD
LOCATIONS, never runtime dependencies. If any link expires, stop and refresh
the source URL from Figma; do not silently replace it with an unrelated icon.
No API tokens or app secrets are required.
"""
from __future__ import annotations

import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = ROOT / "apps/mobile/assets"
MANIFEST = ASSETS_DIR / "figma-source-manifest.json"
MODULES = {
    "figmaAssets": ROOT / "apps/mobile/src/figmaAssets.ts",
    "ownerAssets": ROOT / "apps/mobile/src/ownerAssets.ts",
}
PREFIX = "data:image/svg+xml;utf8,"
SVG_MAX = 1_000_000
PNG_MAX = 3_000_000


def die(message: str) -> None:
    raise RuntimeError(message)


def validate_svg(raw: bytes, key: str) -> str:
    if not raw or len(raw) > SVG_MAX:
        die(f"{key}: empty or oversized SVG ({len(raw)} bytes)")
    try:
        xml = raw.decode("utf-8-sig")
        root = ET.fromstring(xml)
    except (UnicodeError, ET.ParseError) as exc:
        die(f"{key}: Figma response is not valid UTF-8 SVG: {exc}")
    if root.tag.split("}")[-1].lower() != "svg":
        die(f"{key}: expected SVG root, got {root.tag!r}")
    if any(element.tag.split("}")[-1].lower() == "script" for element in root.iter()):
        die(f"{key}: SVG with script is not accepted")
    return PREFIX + urllib.parse.quote(xml, safe="")


def validate_png(raw: bytes, key: str) -> str:
    if not (8 <= len(raw) <= PNG_MAX and raw.startswith(b"\x89PNG\r\n\x1a\n")):
        die(f"{key}: Figma response is not a valid PNG signature or exceeds {PNG_MAX} bytes")
    return "data:image/png;base64," + base64.b64encode(raw).decode("ascii")


def fetch_asset(group: str, key: str, url: str) -> tuple[str, str, str, int, str]:
    if not re.fullmatch(r"https://www\.figma\.com/api/mcp/asset/[0-9a-fA-F-]+\.(svg|png)", url):
        die(f"{group}.{key}: unsupported source URL in Figma manifest")
    fmt = url.rsplit(".", 1)[-1].lower()
    raw = b""
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Charkhoone-Figma-Asset-Vendor/1.0", "Accept": "image/svg+xml,image/png,*/*"})
            with urllib.request.urlopen(req, timeout=25) as response:
                raw = response.read( max(SVG_MAX, PNG_MAX) + 1 )
            break
        except (urllib.error.URLError, TimeoutError) as exc:
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (401, 403, 404, 410):
                die(f"{group}.{key}: Figma source expired or forbidden (HTTP {exc.code}); refresh this source URL from Figma")
            if attempt == 2:
                die(f"{group}.{key}: download failed: {exc}")
            time.sleep(attempt + 1)
    encoded = validate_svg(raw, f"{group}.{key}") if fmt == "svg" else validate_png(raw, f"{group}.{key}")
    return group, key, encoded, len(raw), hashlib.sha256(raw).hexdigest()


def check(manifest: dict[str, object]) -> None:
    expected = manifest["assets"]
    failures: list[str] = []
    for group, path in MODULES.items():
        source = path.read_text(encoding="utf-8")
        found = dict(re.findall(r'^\s*(\w+): ("(?:data:image/svg\+xml;utf8,|data:image/png;base64,)[^"]+"),?$', source, re.M))
        if set(found) != set(expected[group]):
            failures.append(f"{path.relative_to(ROOT)}: asset keys mismatch / not yet vendored")
        if "https://www.figma.com/api/mcp/asset/" in source:
            failures.append(f"{path.relative_to(ROOT)}: still references short-lived Figma URLs")
        for key, literal in found.items():
            value = json.loads(literal)
            try:
                if value.startswith(PREFIX):
                    ET.fromstring(urllib.parse.unquote(value[len(PREFIX):]))
                elif value.startswith("data:image/png;base64,"):
                    raw = base64.b64decode(value.split(",", 1)[1], validate=True)
                    if not raw.startswith(b"\x89PNG\r\n\x1a\n"):
                        raise ValueError("bad PNG signature")
                else:
                    raise ValueError("unrecognized inline format")
            except (ValueError, ET.ParseError) as exc:
                failures.append(f"{group}.{key}: invalid vendored data ({exc})")
    if failures:
        die("Vendored Figma asset verification FAILED:\n" + "\n".join(failures))
    print(f"PASS: all {sum(len(x) for x in expected.values())} Figma asset keys are local and valid; preview has no temporary asset requests.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify assets committed locally without network requests")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("schema_version") != 1 or set(manifest.get("assets", {})) != set(MODULES):
        die("Invalid Figma manifest schema")
    asset_groups = manifest["assets"]
    if args.check:
        check(manifest)
        return
    queue = [(group, key, url) for group, items in asset_groups.items() for key, url in items.items()]
    print(f"Downloading {len(queue)} exact Figma assets into the app source (not runtime network calls)...", flush=True)
    result: dict[str, dict[str, str]] = {group: {} for group in MODULES}
    sha_lines = []
    failed = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        jobs = {pool.submit(fetch_asset, *item): item for item in queue}
        for future in as_completed(jobs):
            group, key, _url = jobs[future]
            try:
                got_group, got_key, encoded, length, digest = future.result()
                result[got_group][got_key] = encoded
                sha_lines.append(f"{digest} {got_group}.{got_key} {length} bytes")
                print(f"  OK  {got_group}.{got_key} ({length} bytes)", flush=True)
            except Exception as exc:
                failed.append(f"{group}.{key}: {exc}")
    if failed:
        die("No modules changed; fix ALL downloads before trying again:\n" + "\n".join(failed))
    # Generate both replacements in memory before writing either one.
    replacements: dict[Path, str] = {}
    for group, target in MODULES.items():
        ordered = {key: result[group][key] for key in asset_groups[group]}
        entries = ",\n".join(f"  {key}: {json.dumps(value, ensure_ascii=True)}" for key, value in ordered.items())
        replacements[target] = (
            "// Vendored exact Figma source bytes, generated by vendor-mobile-figma-assets.py.\n"
            "// All assets are inline; no temporary Figma URL is fetched at runtime.\n"
            f"export const {group} = {{\n{entries}\n}} as const;\n"
        )
    for target, contents in replacements.items():
        target.write_text(contents, encoding="utf-8", newline="\n")
    digest_file = ASSETS_DIR / "figma-assets.sha256.txt"
    digest_file.write_text(
        "# Exact Figma asset sha256, key and source-byte length, generated during vendoring.\n"
        + "\n".join(sorted(sha_lines)) + "\n", encoding="utf-8", newline="\n"
    )
    check(manifest)
    print("Commit apps/mobile/src/{figmaAssets,ownerAssets}.ts and apps/mobile/assets/figma-assets.sha256.txt.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
