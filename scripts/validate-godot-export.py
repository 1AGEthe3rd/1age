#!/usr/bin/env python3
"""Read-only validation of a Godot web export; never deploys or changes DNS."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct

PAGES_LIMIT = 25 * 1024 * 1024


def validate(root, target="generic"):
    root = Path(root).resolve()
    errors, warnings, assets = [], [], []
    html_path = root / "index.html"
    if not html_path.is_file():
        return {"valid": False, "errors": ["Missing index.html"], "warnings": [], "assets": []}
    html = html_path.read_text(encoding="utf-8")
    match = re.search(r"const\s+GODOT_CONFIG\s*=\s*(\{[^\n]+\})\s*;", html)
    try:
        config = json.loads(match.group(1)) if match else None
        if not isinstance(config, dict):
            raise ValueError("missing configuration")
    except (ValueError, AttributeError):
        return {"valid": False, "errors": ["Cannot read JSON GODOT_CONFIG"], "warnings": [], "assets": []}

    sizes = config.get("fileSizes", {})
    executable = config.get("executable", "index")
    if not isinstance(executable, str) or not isinstance(sizes, dict):
        return {"valid": False, "errors": ["Invalid executable/fileSizes configuration"], "warnings": [], "assets": []}
    required = {executable + suffix for suffix in (".js", ".wasm", ".pck")}
    # Godot's engine maps these runtime-loaded dependencies to the export basename.
    engine_path = root / (executable + ".js")
    if engine_path.resolve().is_relative_to(root) and engine_path.is_file():
        engine_text = engine_path.read_text(encoding="utf-8", errors="replace")
        for suffix in (".audio.worklet.js", ".audio.position.worklet.js"):
            if "godot" + suffix in engine_text:
                required.add(executable + suffix)
    required.update(sizes)
    # Only inspect local HTML references. Remote resources require a separate network check.
    for ref in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', html):
        if not ref.startswith(("http:", "https:", "//", "#", "data:", "mailto:")):
            required.add(ref.split("?")[0].split("#")[0])
    for name in sorted(required):
        if not isinstance(name, str):
            errors.append("Non-string asset path")
            continue
        path = (root / name).resolve()
        if not path.is_relative_to(root):
            errors.append(f"Asset escapes export directory: {name}")
            continue
        if not path.is_file():
            errors.append(f"Missing asset: {name}")
            continue
        content = path.read_bytes()
        size = len(content)
        assets.append({"path": name, "bytes": size, "sha256": hashlib.sha256(content).hexdigest()})
        if content.startswith(b"version https://git-lfs.github.com/spec/v1"):
            errors.append(f"Git LFS pointer instead of exported asset: {name}")
        if size == 0:
            errors.append(f"Empty asset: {name}")
        if name in sizes and size != sizes[name]:
            errors.append(f"Size mismatch: {name}: expected {sizes[name]}, found {size}")
        if name.endswith(".wasm") and content[:8] != b"\x00asm\x01\x00\x00\x00":
            errors.append(f"Invalid WebAssembly header: {name}")
        if name.endswith(".pck"):
            if len(content) < 20 or content[:4] != b"GDPC":
                errors.append(f"Invalid Godot package header: {name}")
            else:
                version, major, minor, patch = struct.unpack_from("<4I", content, 4)
                if version not in (2, 3, 4):
                    errors.append(f"Unsupported package format {version}: {name}")
                warnings.append(f"Package {name}: format {version}, engine {major}.{minor}.{patch}; header validation does not verify scene behavior")
        if target == "pages" and size > PAGES_LIMIT:
            errors.append(f"Cloudflare Pages asset exceeds 25 MiB: {name} ({size} bytes)")
    warnings.append("HTTP MIME types, security headers, browser rendering, input, domains, and deployment status require separate integration tests")
    return {"valid": not errors, "target": target, "errors": errors, "warnings": warnings, "assets": assets}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", nargs="?", default=".")
    parser.add_argument("--target", choices=("generic", "pages"), default="generic")
    args = parser.parse_args()
    result = validate(args.directory, args.target)
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["valid"] else 1)
