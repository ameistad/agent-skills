# React Native-Specific Checklist

Items in this file are specific to React Native projects and supplement the platform checklists in ios.md and android.md. Complete both this file and the relevant platform file(s).

## Table of Contents

- [Project Configuration](#project-configuration)
- [iOS-Specific React Native Config](#ios-specific-react-native-config)
- [Android-Specific React Native Config](#android-specific-react-native-config)
- [Performance](#performance)
- [Dependencies](#dependencies)
- [Build and Release](#build-and-release)
- [Expo-Specific](#expo-specific)
- [Common React Native Pitfalls](#common-react-native-pitfalls)

## Project Configuration

- [ ] React Native version is latest stable (or reason documented for older version)
- [ ] New Architecture enabled if on RN 0.76+ (Fabric renderer, TurboModules)
- [ ] `npx react-native doctor` passes all checks
- [ ] TypeScript strict mode enabled (if using TypeScript)
- [ ] Metro bundler configuration correct (metro.config.js)
- [ ] Environment variables handled properly (not bundled into JS, use react-native-config or similar)
- [ ] Hermes engine enabled for both platforms (default since RN 0.70)

## iOS-Specific React Native Config

- [ ] Bundle identifier in Xcode matches App Store Connect
- [ ] `ios/Podfile` platform version set correctly
- [ ] `pod install` runs without errors
- [ ] `ios/Podfile.lock` committed to version control
- [ ] Info.plist contains all permission usage descriptions (check native module READMEs)
- [ ] App icons in `ios/<AppName>/Images.xcassets/AppIcon.appiconset`
- [ ] Launch screen configured (LaunchScreen.storyboard or similar)
- [ ] Privacy manifest (PrivacyInfo.xcprivacy) present and includes entries for RN runtime and native modules
- [ ] Signing configured in Xcode (team, provisioning profile, certificate)
- [ ] Build schemes set for Release configuration

## Android-Specific React Native Config

- [ ] `android/app/build.gradle` applicationId matches Play Console
- [ ] Signing config with keystore configured in `android/app/build.gradle`
- [ ] Keystore file stored securely (not committed to repo)
- [ ] `android/app/src/main/AndroidManifest.xml` permissions are correct
- [ ] ProGuard rules added for React Native and native modules (`android/app/proguard-rules.pro`)
- [ ] App icons in `android/app/src/main/res/mipmap-*` directories
- [ ] Adaptive icons configured (ic_launcher.xml with foreground/background layers)
- [ ] `android/gradle.properties` configured (org.gradle.jvmargs, Hermes flags)
- [ ] App Bundle (.aab) build configured

## Performance

- [ ] Release build tested (JS bundle is minified, Hermes bytecode compiled)
- [ ] React DevTools Profiler used to identify unnecessary re-renders
- [ ] FlatList/SectionList used for long lists (not ScrollView with many children)
- [ ] Images optimized and properly sized (use resizeMode, consider react-native-fast-image)
- [ ] JavaScript thread not blocked by heavy computation (offload to native or use InteractionManager)
- [ ] Animations use `useNativeDriver: true` where possible
- [ ] Bundle size analyzed (use `react-native-bundle-visualizer` or source-map-explorer)
- [ ] Memory leaks checked (listeners cleaned up in useEffect return, subscriptions unsubscribed)
- [ ] Startup time measured on low-end physical devices
- [ ] Flipper/React Native DevTools used for profiling network, layout, performance

## Dependencies

- [ ] `npm audit` or `yarn audit` shows no high/critical vulnerabilities
- [ ] All native modules compatible with current React Native version
- [ ] Native module linking correct (auto-linking or manual)
- [ ] No deprecated packages (check npm/GitHub for maintenance status)
- [ ] Peer dependency warnings resolved
- [ ] License compliance checked for all dependencies
- [ ] Pod versions in sync (run `pod install --repo-update` if needed)

## Build and Release

- [ ] iOS: Archive build succeeds from Xcode (Product > Archive)
- [ ] Android: `cd android && ./gradlew bundleRelease` succeeds
- [ ] Source maps generated and uploaded to error tracking service (Sentry, Bugsnag, etc.)
- [ ] CodePush or OTA update service configured (if using, with proper versioning)
- [ ] Hermes bytecode compilation working in release build
- [ ] CI/CD pipeline builds both platforms successfully
- [ ] Version bumped in both `package.json` and native projects (or use `react-native-version`)

## Expo-Specific

(Skip if using bare React Native)

- [ ] `expo prebuild` generates clean native projects
- [ ] `app.json` / `app.config.js` configured correctly:
  - `ios.bundleIdentifier` matches App Store Connect
  - `android.package` matches Play Console
  - `version` and `ios.buildNumber` / `android.versionCode` set
- [ ] EAS Build configured (`eas.json` with production profile)
- [ ] EAS Submit configured for both stores
- [ ] Config plugins working for all native module customizations
- [ ] `expo-dev-client` removed from production build
- [ ] `expo doctor` passes
- [ ] Over-the-air updates configured with appropriate runtime version policy

## Common React Native Pitfalls

1. **Hermes vs JSC differences**: Some JavaScript features behave differently on Hermes. Test release builds with Hermes enabled.
2. **Native module version mismatches**: Upgrading React Native may break native modules. Check compatibility before upgrading.
3. **iOS permission descriptions**: Native modules may request permissions but not add Info.plist descriptions automatically. Check each module's README.
4. **Android 64-bit requirement**: Ensure all native modules include 64-bit libraries (arm64-v8a).
5. **Large JS bundle**: Tree shaking is limited in Metro. Audit imports and use lazy loading for screens (React.lazy, dynamic imports).
6. **Flipper in production**: Ensure Flipper and debugging tools are stripped from release builds.
7. **Bridging overhead**: Excessive communication between JS and native threads causes jank. Batch operations and minimize bridge crossings (or migrate to New Architecture).
8. **Expo SDK version**: EAS Build may fail if Expo SDK is outdated. Keep SDK version aligned with EAS CLI.
