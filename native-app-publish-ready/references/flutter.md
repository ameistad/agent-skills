# Flutter-Specific Checklist

Items in this file are specific to Flutter projects and supplement the platform checklists in ios.md and android.md. Complete both this file and the relevant platform file(s).

## Table of Contents

- [Project Configuration](#project-configuration)
- [iOS-Specific Flutter Config](#ios-specific-flutter-config)
- [Android-Specific Flutter Config](#android-specific-flutter-config)
- [Performance](#performance)
- [Dependencies](#dependencies)
- [Build and Release](#build-and-release)
- [Common Flutter Pitfalls](#common-flutter-pitfalls)

## Project Configuration

- [ ] Flutter SDK version pinned in pubspec.yaml or .fvmrc
- [ ] `flutter pub outdated` shows no critical updates
- [ ] `flutter analyze` passes with no errors or warnings
- [ ] Dart SDK constraints set correctly in pubspec.yaml
- [ ] Unused dependencies removed from pubspec.yaml
- [ ] `flutter clean` + `flutter pub get` produces a clean build

## iOS-Specific Flutter Config

- [ ] `ios/Runner.xcodeproj` bundle identifier matches App Store Connect
- [ ] `ios/Runner/Info.plist` contains all required permission usage descriptions
- [ ] `ios/Runner/Assets.xcassets/AppIcon.appiconset` contains all icon sizes
- [ ] `ios/Podfile` platform version matches minimum deployment target
- [ ] `ios/Podfile.lock` committed to version control
- [ ] CocoaPods dependencies resolved (`cd ios && pod install`)
- [ ] Xcode workspace used (not project file) for builds
- [ ] `ios/Runner/PrivacyInfo.xcprivacy` manifest present
- [ ] Bitcode setting consistent across all targets
- [ ] Flutter.framework properly embedded

## Android-Specific Flutter Config

- [ ] `android/app/build.gradle` applicationId matches Play Console
- [ ] `android/app/build.gradle` minSdkVersion, targetSdkVersion, compileSdkVersion set correctly
- [ ] Signing config set up in `android/app/build.gradle` for release (uses keystore)
- [ ] `android/app/src/main/AndroidManifest.xml` permissions are minimal and correct
- [ ] `android/app/src/main/res/` contains launcher icons for all densities
- [ ] ProGuard/R8 rules added for Flutter and used plugins (`android/app/proguard-rules.pro`)
- [ ] `android/gradle.properties` has `android.enableR8=true`
- [ ] Multidex enabled if needed (minSdk < 21 with large method count)
- [ ] App Bundle format configured for release

## Performance

- [ ] Release mode build tested (not just debug mode, performance differs significantly)
- [ ] Profile mode used to identify jank with Flutter DevTools
- [ ] No excessive widget rebuilds (use `const` constructors, proper state management)
- [ ] Images properly cached and sized (no oversized assets decoded at runtime)
- [ ] ListView.builder used for long lists (not Column with many children)
- [ ] Shader compilation jank addressed (use `--cache-sksl` warmup if needed)
- [ ] App startup time measured in release mode on low-end device
- [ ] Memory usage profiled (watch for retained image caches, listeners not disposed)
- [ ] Platform channels performing well (no excessive marshalling)
- [ ] Tree shaking working (unused code eliminated in release build)

## Dependencies

- [ ] All plugins support both iOS and Android (or have platform-specific alternatives)
- [ ] Plugin versions compatible with current Flutter SDK
- [ ] Native dependencies (CocoaPods, Gradle) resolve without conflicts
- [ ] No deprecated plugins (check pub.dev scores and maintenance status)
- [ ] Plugins with native code tested on physical devices for both platforms
- [ ] License compliance checked for all dependencies (`flutter pub deps`)

## Build and Release

- [ ] iOS: `flutter build ipa` succeeds without errors
- [ ] Android: `flutter build appbundle` succeeds without errors
- [ ] Obfuscation enabled for release (`--obfuscate --split-debug-info`)
- [ ] Debug symbols saved for crash symbolication
- [ ] Flavor/scheme configured if multiple environments (dev, staging, prod)
- [ ] CI/CD pipeline builds both platforms successfully
- [ ] Version and build number set in `pubspec.yaml` and synced to native projects

## Common Flutter Pitfalls

1. **Different behavior in release vs debug**: Always test release builds. Debug mode uses JIT compilation, release uses AOT, which can surface different issues.
2. **Plugin incompatibilities**: Some plugins conflict at the native level. Test early with `flutter build` for both platforms.
3. **iOS permission descriptions**: Flutter plugins may request permissions but not add Info.plist descriptions. Check all plugin READMEs for required plist entries.
4. **Android Gradle version mismatches**: Plugins may require specific Gradle or AGP versions. Check compatibility matrix.
5. **Missing ProGuard rules**: Third-party native SDKs bundled via plugins may need ProGuard keep rules to avoid runtime crashes in release builds.
6. **Platform-specific UI**: Test that platform-adaptive widgets render correctly on both iOS and Android.
7. **Large app size**: Flutter apps have a minimum size overhead. Use `--analyze-size` flag to identify what's contributing to size.
