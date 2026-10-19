#!/usr/bin/env python3
"""Sign Linh with the current Mac's Xcode account. NEVER export Apple credentials.

The public GitHub workflow intentionally produces only unsigned diagnostics.
Both host app and embedded ReplayKit extension must be signed/provisioned for
the same Team, and both require the same registered iOS App Group entitlement.

Usage:
  python3 sign_on_mac.py --team YOUR_TEAM_ID --device YOUR_IPHONE_UDID
  python3 sign_on_mac.py --team YOUR_TEAM_ID --device YOUR_IPHONE_UDID --install
  python3 sign_on_mac.py --team ABCDE12345 --device 00008020-001111122223000A --check-only

No certificates, profiles, credentials or Apple ID passwords are read by this
script; Xcode looks for the developer account configured on the Mac.
"""
import argparse
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile


def run(*argv, capture=False):
    if not capture:
        print("+", " ".join(str(arg) for arg in argv), flush=True)
    return subprocess.run(
        [str(arg) for arg in argv], check=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


def replace_required(path, source, replacement, expected=1):
    contents = path.read_text(encoding="utf-8")
    occurrences = contents.count(source)
    if occurrences != expected:
        raise RuntimeError(
            "Unexpected project format: " + str(path) + " expected "
            + str(expected) + " occurrences, got " + str(occurrences)
        )
    path.write_text(contents.replace(source, replacement), encoding="utf-8")


def prepare(source_dir, destination, app_id, group_id):
    shutil.copytree(
        source_dir, destination,
        ignore=shutil.ignore_patterns("*.xcodeproj", "*.xcworkspace",
                                     ".DS_Store", "build", "DerivedData"),
    )
    project = destination / "project.yml"
    replace_required(
        project, "PRODUCT_BUNDLE_IDENTIFIER: ai.linh.companion.broadcast",
        "PRODUCT_BUNDLE_IDENTIFIER: " + app_id + ".broadcast"
    )
    replace_required(
        project, "PRODUCT_BUNDLE_IDENTIFIER: ai.linh.companion",
        "PRODUCT_BUNDLE_IDENTIFIER: " + app_id
    )
    replace_required(project, "group.ai.linh.companion", group_id, expected=2)
    replace_required(
        destination / "Sources/ReplayKitPicker.swift",
        '"ai.linh.companion.broadcast"', '"' + app_id + '.broadcast"'
    )
    replace_required(
        destination / "Sources/LinhSharedStore.swift",
        '"group.ai.linh.companion"', '"' + group_id + '"'
    )
    for name in ("Sources/Linh.entitlements",
                 "BroadcastExtension/LinhBroadcast.entitlements"):
        replace_required(destination / name, "group.ai.linh.companion", group_id)

    contents = project.read_text(encoding="utf-8")
    if (contents.count("com.apple.security.application-groups:") != 2
            or contents.count(group_id) != 2):
        raise RuntimeError("App Group must be enabled in both Xcode targets.")
    if not (destination / "BroadcastExtension/SampleHandler.swift").is_file():
        raise RuntimeError("Missing broadcast extension source.")
    return project


def check_signed_bundle(app, extension, app_id, group_id):
    for bundle, identifier in (
        (app, app_id), (extension, app_id + ".broadcast")
    ):
        if not bundle.is_dir():
            raise RuntimeError("Missing built bundle " + str(bundle))
        with (bundle / "Info.plist").open("rb") as f:
            info = plistlib.load(f)
        if info.get("CFBundleIdentifier") != identifier:
            raise RuntimeError("Incorrect signed Bundle Identifier " + str(bundle))
        if not (bundle / "embedded.mobileprovision").is_file():
            raise RuntimeError("No Apple provisioning profile in " + str(bundle))
        run("codesign", "--verify", "--strict", bundle)
        result = run("codesign", "-d", "--entitlements", ":-", bundle,
                     capture=True)
        try:
            entitlements = plistlib.loads(result.stdout)
        except Exception as exc:
            raise RuntimeError("Cannot parse signed entitlements") from exc
        groups = entitlements.get("com.apple.security.application-groups", [])
        if group_id not in groups:
            raise RuntimeError(
                "Missing App Group entitlement in signed bundle: " + str(bundle)
            )


def main():
    parser = argparse.ArgumentParser(
        description="Sign Linh on YOUR Mac with YOUR Apple Development Team."
    )
    parser.add_argument("--team", required=True, help="10-character Apple Team ID")
    parser.add_argument("--device", required=True,
                        help="iPhone UDID as shown in Xcode > Devices")
    parser.add_argument("--app-id", default=None,
                        help="Unique bundle ID (default: com.linh.<team>.companion)")
    parser.add_argument("--install", action="store_true",
                        help="Install on the connected iPhone after signing")
    parser.add_argument("--check-only", action="store_true",
                        help="Offline validation of project configuration; no signing")
    args = parser.parse_args()

    if not re.fullmatch(r"[A-Za-z0-9]{10}", args.team):
        parser.error("--team must be a 10-character Apple Development Team ID")
    if not re.fullmatch(r"[A-Fa-f0-9-]{15,60}", args.device):
        parser.error("--device must be a valid-looking iPhone device identifier")
    app_id = args.app_id or ("com.linh." + args.team.lower() + ".companion")
    if not re.fullmatch(r"[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){2,6}", app_id):
        parser.error("--app-id must be a dotted Apple bundle identifier")
    if app_id == "ai.linh.companion":
        parser.error("Use a unique app identifier belonging to YOUR Apple team")
    group_id = "group." + app_id
    source_dir = Path(__file__).resolve().parent

    if not args.check_only:
        if sys.platform != "darwin":
            parser.error("Apple code signing must be run on a Mac with Xcode")
        for tool in ("xcodegen", "xcodebuild", "codesign", "xcrun", "ditto"):
            if not shutil.which(tool):
                parser.error("Missing Mac signing tool: " + tool)
        sdk = run("xcrun", "--sdk", "iphoneos", "--show-sdk-version",
                  capture=True).stdout.decode().strip()
        if int(sdk.split(".", 1)[0]) < 27:
            parser.error("This project needs an Xcode installation with iOS 27 SDK")

    with tempfile.TemporaryDirectory(prefix="linh-sign-") as temp_dir:
        root = Path(temp_dir)
        project_dir = root / "LinhCompanion"
        prepare(source_dir, project_dir, app_id, group_id)
        print("Prepared host:", app_id)
        print("Prepared extension:", app_id + ".broadcast")
        print("Shared App Group:", group_id)
        if args.check_only:
            print("PASS: two targets use the same configurable App Group")
            return

        # Signing/provisioning happens only on the owner's Mac. Xcode must
        # already have a logged-in Apple account with permissions for App Groups.
        run("xcodegen", "generate", "--spec", project_dir / "project.yml",
            "--project", project_dir)
        run(
            "xcodebuild", "-project", project_dir / "LinhCompanion.xcodeproj",
            "-scheme", "LinhCompanion", "-configuration", "Debug",
            "-sdk", "iphoneos",
            "-destination", "platform=iOS,id=" + args.device,
            "-derivedDataPath", root / "DerivedData",
            "-allowProvisioningUpdates",
            "CODE_SIGN_STYLE=Automatic", "DEVELOPMENT_TEAM=" + args.team,
            "build",
        )
        app = (root / "DerivedData/Build/Products/Debug-iphoneos/"
               "LinhCompanion.app")
        extension = app / "PlugIns/LinhBroadcast.appex"
        check_signed_bundle(app, extension, app_id, group_id)

        if args.install:
            run("xcrun", "devicectl", "device", "install", "app",
                "--device", args.device, app)
            print("PASS: signed and installed on the connected device.")
        else:
            output_dir = source_dir / "signed-output"
            output_dir.mkdir(exist_ok=True)
            payload = root / "Payload"
            payload.mkdir()
            shutil.copytree(app, payload / "LinhCompanion.app", symlinks=True)
            ipa = output_dir / "Linh-DEV-signed.ipa"
            run("ditto", "-c", "-k", "--sequesterRsrc", "--keepParent",
                payload, ipa)
            print("PASS: signed iPhone app:", ipa)
            print("Development-signed IPA requires a provisioned device.")
        print("Do not commit or publicly share the signed IPA or signing assets.")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        print("Xcode signing failed. Check Team membership, unique Bundle IDs, "
              "registered App Group and provisioning for BOTH targets.",
              file=sys.stderr)
        raise SystemExit(error.returncode)
    except RuntimeError as error:
        print("Signing preparation/verification failed:", error, file=sys.stderr)
        raise SystemExit(1)
