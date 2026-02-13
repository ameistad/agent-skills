#!/usr/bin/env python3
"""
App Store Readiness - Project Scanner

Detects project type (native iOS, native Android, Flutter, React Native)
and runs automated checks for common submission issues.

Usage:
    python3 check_project.py <project-root>

Output: JSON report to stdout, status messages to stderr.
"""

import json
import os
import sys
import re
import plistlib
import xml.etree.ElementTree as ET
from pathlib import Path


def detect_project_type(root: Path) -> dict:
    """Detect what kind of mobile project this is."""
    result = {
        "framework": None,  # "flutter", "react-native", "native"
        "platforms": [],     # ["ios", "android"]
    }

    # Flutter
    if (root / "pubspec.yaml").exists() and (root / "lib").exists():
        result["framework"] = "flutter"
        if (root / "ios").exists():
            result["platforms"].append("ios")
        if (root / "android").exists():
            result["platforms"].append("android")
        return result

    # React Native
    pkg_json = root / "package.json"
    if pkg_json.exists():
        try:
            pkg = json.loads(pkg_json.read_text())
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "react-native" in deps or "expo" in deps:
                result["framework"] = "react-native"
                if (root / "ios").exists():
                    result["platforms"].append("ios")
                if (root / "android").exists():
                    result["platforms"].append("android")
                return result
        except (json.JSONDecodeError, OSError):
            pass

    # Native
    result["framework"] = "native"
    xcodeproj = list(root.glob("*.xcodeproj")) + list(root.glob("*.xcworkspace"))
    if xcodeproj or (root / "ios").exists():
        result["platforms"].append("ios")
    if (root / "app" / "build.gradle").exists() or (root / "app" / "build.gradle.kts").exists():
        result["platforms"].append("android")
    elif (root / "android" / "app" / "build.gradle").exists() or (root / "android" / "app" / "build.gradle.kts").exists():
        result["platforms"].append("android")

    return result


def find_info_plist(root: Path) -> Path | None:
    """Find the main Info.plist file."""
    candidates = [
        root / "ios" / "Runner" / "Info.plist",        # Flutter
        root / "Info.plist",                            # Native at root
    ]
    # Search for Info.plist in common locations
    for p in candidates:
        if p.exists():
            return p
    # Glob for it
    plists = list(root.glob("**/Info.plist"))
    # Prefer ones not in Pods or build directories
    for p in plists:
        parts = str(p)
        if "Pods" not in parts and "build" not in parts and "DerivedData" not in parts:
            return p
    return plists[0] if plists else None


def find_android_manifest(root: Path) -> Path | None:
    """Find the main AndroidManifest.xml."""
    candidates = [
        root / "android" / "app" / "src" / "main" / "AndroidManifest.xml",
        root / "app" / "src" / "main" / "AndroidManifest.xml",
    ]
    for p in candidates:
        if p.exists():
            return p
    manifests = list(root.glob("**/src/main/AndroidManifest.xml"))
    for m in manifests:
        if "build" not in str(m):
            return m
    return manifests[0] if manifests else None


def find_build_gradle(root: Path) -> Path | None:
    """Find the app-level build.gradle."""
    candidates = [
        root / "android" / "app" / "build.gradle",
        root / "android" / "app" / "build.gradle.kts",
        root / "app" / "build.gradle",
        root / "app" / "build.gradle.kts",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def check_ios(root: Path, framework: str) -> list[dict]:
    """Run iOS-specific checks."""
    issues = []

    def warn(category, message, severity="warning"):
        issues.append({"platform": "ios", "category": category, "message": message, "severity": severity})

    def error(category, message):
        warn(category, message, "error")

    def ok(category, message):
        issues.append({"platform": "ios", "category": category, "message": message, "severity": "pass"})

    # Info.plist
    plist_path = find_info_plist(root)
    if plist_path:
        ok("config", f"Info.plist found at {plist_path.relative_to(root)}")
        try:
            with open(plist_path, "rb") as f:
                plist = plistlib.load(f)

            # Check bundle identifier
            bundle_id = plist.get("CFBundleIdentifier")
            if bundle_id:
                if "$(" in bundle_id:
                    ok("config", f"Bundle identifier uses build variable: {bundle_id}")
                else:
                    ok("config", f"Bundle identifier: {bundle_id}")
            else:
                error("config", "CFBundleIdentifier missing from Info.plist")

            # Check version
            version = plist.get("CFBundleShortVersionString")
            build = plist.get("CFBundleVersion")
            if version:
                ok("version", f"Version: {version} (build {build})")
            else:
                error("version", "CFBundleShortVersionString missing")
            if not build:
                error("version", "CFBundleVersion (build number) missing")

            # Check permission usage descriptions
            permission_keys = {
                "NSCameraUsageDescription": "Camera",
                "NSPhotoLibraryUsageDescription": "Photo Library",
                "NSLocationWhenInUseUsageDescription": "Location (When In Use)",
                "NSLocationAlwaysAndWhenInUseUsageDescription": "Location (Always)",
                "NSMicrophoneUsageDescription": "Microphone",
                "NSContactsUsageDescription": "Contacts",
                "NSCalendarsUsageDescription": "Calendars",
                "NSBluetoothAlwaysUsageDescription": "Bluetooth",
                "NSFaceIDUsageDescription": "Face ID",
                "NSMotionUsageDescription": "Motion",
                "NSLocalNetworkUsageDescription": "Local Network",
                "NSSpeechRecognitionUsageDescription": "Speech Recognition",
                "NSHealthShareUsageDescription": "Health (Read)",
                "NSHealthUpdateUsageDescription": "Health (Write)",
                "NSUserTrackingUsageDescription": "Tracking (ATT)",
            }
            found_permissions = []
            for key, name in permission_keys.items():
                val = plist.get(key)
                if val:
                    if len(val.strip()) < 10:
                        warn("privacy", f"{name} permission description is very short: \"{val}\". Apple may reject vague descriptions.")
                    else:
                        found_permissions.append(name)
            if found_permissions:
                ok("privacy", f"Permission descriptions found for: {', '.join(found_permissions)}")

            # Check ATS
            ats = plist.get("NSAppTransportSecurity", {})
            if ats.get("NSAllowsArbitraryLoads"):
                warn("security", "NSAllowsArbitraryLoads is enabled. Apple will require justification during review.")

        except Exception as e:
            warn("config", f"Could not parse Info.plist: {e}")
    else:
        error("config", "Info.plist not found")

    # Privacy manifest
    privacy_manifests = list(root.glob("**/PrivacyInfo.xcprivacy"))
    privacy_manifests = [p for p in privacy_manifests if "Pods" not in str(p) and "build" not in str(p)]
    if privacy_manifests:
        ok("privacy", f"Privacy manifest found: {privacy_manifests[0].relative_to(root)}")
    else:
        error("privacy", "PrivacyInfo.xcprivacy not found. Required since iOS 17.")

    # App icon
    icon_sets = list(root.glob("**/AppIcon.appiconset"))
    icon_sets = [p for p in icon_sets if "Pods" not in str(p) and "build" not in str(p)]
    if icon_sets:
        contents_json = icon_sets[0] / "Contents.json"
        if contents_json.exists():
            try:
                contents = json.loads(contents_json.read_text())
                images = contents.get("images", [])
                has_1024 = any(
                    img.get("size") == "1024x1024" and img.get("filename")
                    for img in images
                )
                if has_1024:
                    ok("assets", "1024x1024 App Store icon found")
                else:
                    error("assets", "Missing 1024x1024 App Store icon in AppIcon.appiconset")
            except (json.JSONDecodeError, OSError):
                warn("assets", "Could not parse AppIcon.appiconset/Contents.json")
        else:
            warn("assets", "AppIcon.appiconset found but no Contents.json")
    else:
        error("assets", "AppIcon.appiconset not found")

    # Hardcoded secrets check (basic)
    swift_files = list(root.glob("**/*.swift"))
    swift_files = [f for f in swift_files if "Pods" not in str(f) and "build" not in str(f)]
    secret_patterns = [
        (r'(?i)(api[_-]?key|secret[_-]?key|password)\s*[:=]\s*"[^"]{8,}"', "Possible hardcoded API key/secret"),
        (r'sk[-_](?:live|test)_[a-zA-Z0-9]{20,}', "Possible Stripe secret key"),
        (r'AIza[0-9A-Za-z\-_]{35}', "Possible Google API key"),
    ]
    for sf in swift_files[:200]:  # Limit scan scope
        try:
            content = sf.read_text(errors="ignore")
            for pattern, desc in secret_patterns:
                if re.search(pattern, content):
                    warn("security", f"{desc} found in {sf.relative_to(root)}")
                    break
        except OSError:
            pass

    return issues


def check_android(root: Path, framework: str) -> list[dict]:
    """Run Android-specific checks."""
    issues = []

    def warn(category, message, severity="warning"):
        issues.append({"platform": "android", "category": category, "message": message, "severity": severity})

    def error(category, message):
        warn(category, message, "error")

    def ok(category, message):
        issues.append({"platform": "android", "category": category, "message": message, "severity": "pass"})

    # AndroidManifest.xml
    manifest_path = find_android_manifest(root)
    if manifest_path:
        ok("config", f"AndroidManifest.xml found at {manifest_path.relative_to(root)}")
        try:
            tree = ET.parse(manifest_path)
            manifest_root = tree.getroot()
            ns = {"android": "http://schemas.android.com/apk/res/android"}

            # Package name
            package = manifest_root.get("package")
            if package:
                ok("config", f"Package name: {package}")
            else:
                # Android Gradle Plugin 7.0+ may define applicationId in build.gradle only
                warn("config", "Package name not in manifest (may be set in build.gradle)")

            # Permissions
            permissions = []
            for perm in manifest_root.findall("uses-permission"):
                perm_name = perm.get(f"{{{ns['android']}}}name", "")
                permissions.append(perm_name.split(".")[-1])
            if permissions:
                ok("privacy", f"Declared permissions: {', '.join(permissions)}")

            dangerous_perms = [
                "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_BACKGROUND_LOCATION",
                "CAMERA", "RECORD_AUDIO", "READ_CONTACTS", "WRITE_CONTACTS",
                "READ_CALENDAR", "WRITE_CALENDAR", "READ_PHONE_STATE",
                "CALL_PHONE", "READ_CALL_LOG", "WRITE_CALL_LOG",
                "BODY_SENSORS", "SEND_SMS", "READ_SMS",
                "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE",
                "QUERY_ALL_PACKAGES",
            ]
            used_dangerous = [p for p in permissions if p in dangerous_perms]
            if used_dangerous:
                warn("privacy", f"Dangerous permissions detected: {', '.join(used_dangerous)}. Ensure runtime permission requests and justification.")

            # Internet permission (common, not dangerous but worth noting)
            if "INTERNET" in permissions:
                ok("config", "INTERNET permission declared")

        except ET.ParseError as e:
            warn("config", f"Could not parse AndroidManifest.xml: {e}")
    else:
        error("config", "AndroidManifest.xml not found")

    # build.gradle
    gradle_path = find_build_gradle(root)
    if gradle_path:
        ok("config", f"build.gradle found at {gradle_path.relative_to(root)}")
        try:
            gradle_content = gradle_path.read_text()

            # Version info
            version_match = re.search(r'versionName\s+["\']([^"\']+)["\']', gradle_content)
            version_code_match = re.search(r'versionCode\s+(\d+)', gradle_content)
            if version_match:
                ok("version", f"versionName: {version_match.group(1)}")
            if version_code_match:
                ok("version", f"versionCode: {version_code_match.group(1)}")

            # SDK versions
            min_sdk = re.search(r'minSdk(?:Version)?\s+(\d+)', gradle_content)
            target_sdk = re.search(r'targetSdk(?:Version)?\s+(\d+)', gradle_content)
            compile_sdk = re.search(r'compileSdk(?:Version)?\s+(\d+)', gradle_content)

            if target_sdk:
                sdk_val = int(target_sdk.group(1))
                if sdk_val < 34:
                    warn("config", f"targetSdkVersion is {sdk_val}. Google Play requires 34+ for new apps.")
                else:
                    ok("config", f"targetSdkVersion: {sdk_val}")

            # Signing config
            if "signingConfigs" in gradle_content and "release" in gradle_content:
                ok("build", "Release signing config found")
            else:
                warn("build", "No release signing config found in build.gradle. Required for Play Store submission.")

            # ProGuard/R8
            if "minifyEnabled true" in gradle_content or "isMinifyEnabled = true" in gradle_content:
                ok("build", "Code minification (R8/ProGuard) enabled")
            else:
                warn("build", "minifyEnabled is not set to true for release. Recommended for smaller APK and code obfuscation.")

        except OSError as e:
            warn("config", f"Could not read build.gradle: {e}")
    else:
        error("config", "App-level build.gradle not found")

    # App icons
    android_base = root / "android" if (root / "android").exists() else root
    res_dir = android_base / "app" / "src" / "main" / "res"
    if res_dir.exists():
        mipmap_dirs = list(res_dir.glob("mipmap-*"))
        if mipmap_dirs:
            ok("assets", f"Mipmap directories found: {len(mipmap_dirs)} densities")
        else:
            warn("assets", "No mipmap directories found for app icons")

        # Adaptive icon check
        adaptive_icons = list(res_dir.glob("mipmap-anydpi*/**/ic_launcher.xml"))
        if adaptive_icons:
            ok("assets", "Adaptive icon configured")
        else:
            warn("assets", "No adaptive icon found (ic_launcher.xml in mipmap-anydpi). Recommended for Android 8+.")
    else:
        warn("assets", f"Resource directory not found at expected path")

    # Hardcoded secrets
    java_kotlin_files = list(root.glob("**/*.kt")) + list(root.glob("**/*.java"))
    java_kotlin_files = [f for f in java_kotlin_files if "build" not in str(f) and ".gradle" not in str(f)]
    secret_patterns = [
        (r'(?i)(api[_-]?key|secret[_-]?key|password)\s*=\s*"[^"]{8,}"', "Possible hardcoded API key/secret"),
        (r'sk[-_](?:live|test)_[a-zA-Z0-9]{20,}', "Possible Stripe secret key"),
        (r'AIza[0-9A-Za-z\-_]{35}', "Possible Google API key"),
    ]
    for jf in java_kotlin_files[:200]:
        try:
            content = jf.read_text(errors="ignore")
            for pattern, desc in secret_patterns:
                if re.search(pattern, content):
                    warn("security", f"{desc} found in {jf.relative_to(root)}")
                    break
        except OSError:
            pass

    return issues


def check_flutter(root: Path) -> list[dict]:
    """Run Flutter-specific checks."""
    issues = []

    def warn(category, message, severity="warning"):
        issues.append({"platform": "flutter", "category": category, "message": message, "severity": severity})

    def error(category, message):
        warn(category, message, "error")

    def ok(category, message):
        issues.append({"platform": "flutter", "category": category, "message": message, "severity": "pass"})

    pubspec = root / "pubspec.yaml"
    if pubspec.exists():
        content = pubspec.read_text()

        # Version
        version_match = re.search(r'^version:\s*(.+)$', content, re.MULTILINE)
        if version_match:
            ok("version", f"Version in pubspec.yaml: {version_match.group(1).strip()}")
        else:
            error("version", "No version found in pubspec.yaml")

        # SDK constraint
        if "sdk:" in content:
            ok("config", "Dart SDK constraint defined")
        else:
            warn("config", "No Dart SDK constraint in pubspec.yaml")

    # Podfile.lock
    if (root / "ios" / "Podfile.lock").exists():
        ok("config", "ios/Podfile.lock committed")
    elif (root / "ios").exists():
        warn("config", "ios/Podfile.lock not found. Should be committed to version control.")

    return issues


def check_react_native(root: Path) -> list[dict]:
    """Run React Native-specific checks."""
    issues = []

    def warn(category, message, severity="warning"):
        issues.append({"platform": "react-native", "category": category, "message": message, "severity": severity})

    def error(category, message):
        warn(category, message, "error")

    def ok(category, message):
        issues.append({"platform": "react-native", "category": category, "message": message, "severity": "pass"})

    pkg_json = root / "package.json"
    if pkg_json.exists():
        try:
            pkg = json.loads(pkg_json.read_text())
            deps = pkg.get("dependencies", {})
            dev_deps = pkg.get("devDependencies", {})

            # RN version
            rn_version = deps.get("react-native", "")
            if rn_version:
                ok("config", f"React Native version: {rn_version}")

            # Expo check
            if "expo" in deps:
                ok("config", f"Expo SDK: {deps.get('expo', 'detected')}")

                # Check app.json/app.config.js
                app_json = root / "app.json"
                app_config = root / "app.config.js"
                app_config_ts = root / "app.config.ts"
                if app_json.exists() or app_config.exists() or app_config_ts.exists():
                    ok("config", "App config file found")
                else:
                    error("config", "No app.json or app.config.js found for Expo project")

            # Check for debug/dev tools in production deps
            debug_pkgs = ["react-native-debugger", "reactotron-react-native", "expo-dev-client"]
            found_debug = [p for p in debug_pkgs if p in deps]
            if found_debug:
                warn("build", f"Debug packages in production dependencies: {', '.join(found_debug)}. Move to devDependencies or remove.")

            # Version in package.json
            version = pkg.get("version")
            if version:
                ok("version", f"Version in package.json: {version}")

        except (json.JSONDecodeError, OSError):
            warn("config", "Could not parse package.json")

    # Podfile.lock
    if (root / "ios" / "Podfile.lock").exists():
        ok("config", "ios/Podfile.lock committed")
    elif (root / "ios").exists():
        warn("config", "ios/Podfile.lock not found. Should be committed to version control.")

    return issues


def check_common(root: Path) -> list[dict]:
    """Checks applicable to all project types."""
    issues = []

    def warn(category, message, severity="warning"):
        issues.append({"platform": "common", "category": category, "message": message, "severity": severity})

    def ok(category, message):
        issues.append({"platform": "common", "category": category, "message": message, "severity": "pass"})

    # .env files
    env_files = list(root.glob(".env*"))
    env_files = [f for f in env_files if f.name != ".env.example" and f.name != ".env.template"]
    if env_files:
        warn("security", f"Environment files found: {', '.join(f.name for f in env_files)}. Ensure these are in .gitignore and not bundled in release builds.")

    # .gitignore check for secrets
    gitignore = root / ".gitignore"
    if gitignore.exists():
        gi_content = gitignore.read_text()
        if ".env" in gi_content:
            ok("security", ".env is in .gitignore")
        else:
            warn("security", ".env is NOT in .gitignore. Secrets may be committed.")
    else:
        warn("security", "No .gitignore found")

    # Privacy policy
    # Can't check URL validity without network, but check if referenced
    readme = root / "README.md"
    if readme.exists():
        readme_content = readme.read_text(errors="ignore")
        if "privacy" in readme_content.lower():
            ok("legal", "Privacy policy referenced in README")

    return issues


def main():
    if len(sys.argv) < 2:
        print("Usage: check_project.py <project-root>", file=sys.stderr)
        sys.exit(1)

    root = Path(sys.argv[1]).resolve()
    if not root.is_dir():
        print(f"Error: {root} is not a directory", file=sys.stderr)
        sys.exit(1)

    print(f"Scanning: {root}", file=sys.stderr)

    # Detect project type
    project = detect_project_type(root)
    print(f"Detected: framework={project['framework']}, platforms={project['platforms']}", file=sys.stderr)

    all_issues = []

    # Common checks
    all_issues.extend(check_common(root))

    # Framework-specific
    if project["framework"] == "flutter":
        all_issues.extend(check_flutter(root))
    elif project["framework"] == "react-native":
        all_issues.extend(check_react_native(root))

    # Platform-specific
    if "ios" in project["platforms"]:
        all_issues.extend(check_ios(root, project["framework"]))
    if "android" in project["platforms"]:
        all_issues.extend(check_android(root, project["framework"]))

    # Summary
    errors = [i for i in all_issues if i["severity"] == "error"]
    warnings = [i for i in all_issues if i["severity"] == "warning"]
    passes = [i for i in all_issues if i["severity"] == "pass"]

    report = {
        "project_root": str(root),
        "project_type": project,
        "summary": {
            "errors": len(errors),
            "warnings": len(warnings),
            "passes": len(passes),
        },
        "issues": all_issues,
    }

    print(json.dumps(report, indent=2))

    print(f"\nResults: {len(errors)} errors, {len(warnings)} warnings, {len(passes)} passed", file=sys.stderr)


if __name__ == "__main__":
    main()
