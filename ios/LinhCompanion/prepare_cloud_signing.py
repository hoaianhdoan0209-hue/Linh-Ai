#!/usr/bin/env python3
"""Prepare XcodeGen source for cloud signing, never read or emit Apple credentials."""
import argparse
import json
import shutil
from pathlib import Path
import re
import sys

from sign_on_mac import prepare


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundle-id", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--build-number", type=int, default=3)
    args = parser.parse_args()
    bundle = args.bundle_id.strip()
    if (bundle in ("com.replace.with.your.linh", "ai.linh.companion")
            or not re.fullmatch(r"[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+){2,6}", bundle)):
        parser.error("Use your own registered Apple bundle identifier; update codemagic.yaml first")
    if args.build_number < 3:
        parser.error("--build-number must be 3 or greater")
    source = Path(__file__).resolve().parent
    destination = Path(args.output).resolve()
    if source == destination or source in destination.parents:
        parser.error("Build output must be outside the original iOS project folder")
    if destination.exists():
        parser.error("Output folder exists; use a fresh temporary build directory")

    group = "group." + bundle
    project = prepare(source, destination, bundle, group)
    config = project.read_text(encoding="utf-8")
    marker = 'CFBundleVersion: "2"'
    if config.count(marker) != 2:
        raise RuntimeError("XcodeGen version fields changed; cannot keep targets in sync")
    config = config.replace(marker, 'CFBundleVersion: "' + str(args.build_number) + '"')
    config = config.replace(
        'ASSETCATALOG_COMPILER_APPICON_NAME: ""',
        'ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon"',
    )
    if config.count('ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon"') != 1:
        raise RuntimeError("XcodeGen app icon compiler configuration changed")
    project.write_text(config, encoding="utf-8")

    # Reuse the existing Linh PWA icon, not a generated replacement image.
    # The cloud Mac converts the SVG to PNG before running XcodeGen.
    icon_source = source.parents[1] / "icon.svg"
    if not icon_source.is_file():
        raise RuntimeError("Missing existing Linh icon.svg")
    shutil.copyfile(icon_source, destination / "LinhIcon.svg")
    icon_dir = destination / "Sources/Assets.xcassets/AppIcon.appiconset"
    icon_dir.mkdir(parents=True, exist_ok=True)
    (icon_dir / "Contents.json").write_text(json.dumps({
        "images": [{
            "filename": "AppIcon.png",
            "idiom": "universal",
            "platform": "ios",
            "size": "1024x1024",
        }],
        "info": {"author": "xcode", "version": 1},
    }), encoding="utf-8")

    if config.count("com.apple.security.application-groups:") != 2:
        raise RuntimeError("Both signed targets must have an App Group entitlement")
    print("PASS: cloud Xcode project generated without secrets")
    print("Host:", bundle)
    print("ReplayKit:", bundle + ".broadcast")
    print("App Group:", group)
    print("Build:", args.build_number)


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as exc:
        print("Prepare failed:", exc, file=sys.stderr)
        raise SystemExit(1)
