# iOS App Store Checklist

## Table of Contents

- [Developer Account](#developer-account)
- [App Store Connect Setup](#app-store-connect-setup)
- [Build Configuration](#build-configuration)
- [Privacy and Permissions](#privacy-and-permissions)
- [App Store Assets](#app-store-assets)
- [Metadata and Compliance](#metadata-and-compliance)
- [Technical Requirements](#technical-requirements)
- [In-App Purchases](#in-app-purchases)
- [App Review Preparation](#app-review-preparation)
- [Pre-Submission Testing](#pre-submission-testing)
- [Common Rejection Reasons](#common-rejection-reasons)

## Developer Account

- [ ] Apple Developer Program enrolled ($99/year)
- [ ] Tax and banking information complete in App Store Connect
- [ ] All agreements (Paid Applications, Free Applications) accepted
- [ ] Certificates (distribution) created and not expired
- [ ] Provisioning profiles created with correct App ID and entitlements

## App Store Connect Setup

- [ ] App record created in App Store Connect
- [ ] Bundle ID registered and matches Xcode project exactly
- [ ] SKU assigned
- [ ] Primary language set
- [ ] Content rights declared (does the app contain third-party content?)

## Build Configuration

- [ ] Version number follows semantic versioning (CFBundleShortVersionString)
- [ ] Build number incremented from last submission (CFBundleVersion)
- [ ] Release build configuration used (not Debug)
- [ ] Bitcode enabled (if required for target deployment)
- [ ] All architectures included (arm64 required, arm64e for newer devices)
- [ ] Minimum deployment target set appropriately
- [ ] All entitlements configured correctly in both Xcode and provisioning profile
- [ ] Privacy manifest included (PrivacyInfo.xcprivacy, required since iOS 17)
- [ ] Required device capabilities set correctly in Info.plist (UIRequiredDeviceCapabilities)
- [ ] App Transport Security configured (no arbitrary loads unless justified)
- [ ] No references to private/undocumented APIs

## Privacy and Permissions

- [ ] Info.plist contains usage descriptions for ALL requested permissions:
  - NSCameraUsageDescription
  - NSPhotoLibraryUsageDescription
  - NSLocationWhenInUseUsageDescription / NSLocationAlwaysAndWhenInUseUsageDescription
  - NSMicrophoneUsageDescription
  - NSContactsUsageDescription
  - NSCalendarsUsageDescription
  - NSBluetoothAlwaysUsageDescription
  - NSFaceIDUsageDescription
  - NSHealthShareUsageDescription / NSHealthUpdateUsageDescription
  - NSMotionUsageDescription
  - NSSpeechRecognitionUsageDescription
  - NSLocalNetworkUsageDescription
  - (any others the app uses)
- [ ] All usage descriptions are human-readable and explain WHY the permission is needed
- [ ] Privacy nutrition labels accurate in App Store Connect (data collection, data use, data linked to user)
- [ ] ATT (App Tracking Transparency) prompt shown before any tracking (if applicable)
- [ ] No tracking identifiers collected without ATT consent
- [ ] Privacy manifest lists all required API reasons (Required Reason APIs)
- [ ] Third-party SDK privacy manifests included

## App Store Assets

- [ ] App icon: 1024x1024 PNG, no alpha channel, no rounded corners (system applies them)
- [ ] Screenshots provided for all required device sizes:
  - 6.9" display (iPhone 16 Pro Max): 1320 x 2868 or 2868 x 1320
  - 6.7" display (iPhone 15 Plus/Pro Max): 1290 x 2796 or 2796 x 1290
  - 6.5" display (iPhone 11 Pro Max): 1284 x 2778 or 2778 x 1284
  - 5.5" display (iPhone 8 Plus): 1242 x 2208 or 2208 x 1242
  - iPad Pro 13" (6th gen): 2064 x 2752 or 2752 x 2064
  - iPad Pro 11" (if different from 13"): scaled accordingly
- [ ] Minimum 3 screenshots per device size (maximum 10)
- [ ] Screenshots show actual app functionality (no misleading content)
- [ ] App preview videos uploaded (optional, max 30 seconds, up to 3 per locale)

## Metadata and Compliance

- [ ] App name (max 30 characters)
- [ ] Subtitle (max 30 characters)
- [ ] Description (max 4000 characters, no prices or guarantees of rankings)
- [ ] Keywords (max 100 characters, comma-separated)
- [ ] Promotional text (max 170 characters, can be updated without new build)
- [ ] What's New text filled for updates
- [ ] Support URL active and functional
- [ ] Marketing URL (optional)
- [ ] Privacy policy URL (required for apps with accounts, subscriptions, or data collection)
- [ ] Copyright information (e.g., "2025 Company Name")
- [ ] Category and optional secondary category selected
- [ ] Age rating questionnaire completed accurately
- [ ] IDFA usage declared if applicable
- [ ] Export compliance information completed (encryption usage)
- [ ] Content rights declaration completed

## Technical Requirements

- [ ] No crashes on any supported device/OS combination
- [ ] Tested on physical devices (not just Simulator)
- [ ] App size under 200 MB for cellular download limit (use On Demand Resources or App Thinning for larger apps)
- [ ] Launch time under 20 seconds (system kills apps exceeding this)
- [ ] Dark mode supported or gracefully handled
- [ ] Dynamic Type supported for accessibility
- [ ] VoiceOver accessibility implemented for key flows
- [ ] All third-party SDKs updated to latest stable versions
- [ ] No deprecated API usage that would trigger warnings
- [ ] Memory usage within acceptable limits (test with Instruments)
- [ ] No excessive battery drain (test with Instruments Energy Log)
- [ ] IPv6-only network compatibility verified
- [ ] Handles interruptions gracefully (phone calls, notifications, backgrounding)
- [ ] Correct behavior on all supported orientations
- [ ] API keys and secrets not hardcoded in binary

## In-App Purchases

(Skip if no IAP)

- [ ] All products created in App Store Connect with correct types (consumable, non-consumable, auto-renewable subscription, non-renewing subscription)
- [ ] Products submitted for review along with the app
- [ ] Restore purchases functionality implemented and working
- [ ] Receipt validation implemented (server-side recommended)
- [ ] Subscription management accessible from within the app
- [ ] Price and subscription terms clearly displayed before purchase
- [ ] Free trial terms clearly communicated if applicable
- [ ] StoreKit 2 or StoreKit 1 properly integrated
- [ ] Tested in Sandbox environment on real devices

## App Review Preparation

- [ ] Demo account credentials provided (if app requires login)
- [ ] App review notes explain any non-obvious features or required hardware
- [ ] Contact information (name, phone, email) up to date
- [ ] Reviewer instructions for features requiring special setup
- [ ] If using background modes, explain why in review notes
- [ ] If using non-standard URL schemes, document them

## Pre-Submission Testing

- [ ] Full regression test on latest iOS version
- [ ] Test on oldest supported iOS version
- [ ] Test on both iPhone and iPad (if universal)
- [ ] All deep links and universal links verified
- [ ] Push notifications tested end-to-end
- [ ] All localizations verified (if supporting multiple languages)
- [ ] Accessibility audit completed (Accessibility Inspector)
- [ ] Network error handling verified (airplane mode, slow connection)
- [ ] Sign in with Apple works (if implemented, required if any third-party sign-in offered)
- [ ] App Clip tested (if applicable)

## Common Rejection Reasons

1. **Guideline 2.1 - App Completeness**: Crashes, broken links, placeholder content
2. **Guideline 2.3 - Accurate Metadata**: Screenshots or description don't match app functionality
3. **Guideline 4.0 - Design**: Non-standard UI that confuses users, webview-only apps
4. **Guideline 5.1.1 - Data Collection**: Missing or inaccurate privacy labels
5. **Guideline 5.1.2 - Data Use and Sharing**: Collecting data not disclosed
6. **Guideline 3.1.1 - In-App Purchase**: Using external payment for digital goods
7. **Guideline 4.2 - Minimum Functionality**: App is too simple or a repackaged website
8. **Guideline 2.5.1 - Software Requirements**: Using private APIs
9. **Guideline 5.1.1(v)**: Account deletion not offered (required since June 2022)
10. **Missing purpose strings**: Permissions requested without Info.plist descriptions
