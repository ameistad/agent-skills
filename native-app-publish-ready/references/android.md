# Google Play Store Checklist

## Table of Contents

- [Developer Account](#developer-account)
- [Google Play Console Setup](#google-play-console-setup)
- [Build Configuration](#build-configuration)
- [Privacy and Permissions](#privacy-and-permissions)
- [Store Listing Assets](#store-listing-assets)
- [Metadata and Compliance](#metadata-and-compliance)
- [Technical Requirements](#technical-requirements)
- [In-App Purchases and Billing](#in-app-purchases-and-billing)
- [Review Preparation](#review-preparation)
- [Pre-Submission Testing](#pre-submission-testing)
- [Common Rejection Reasons](#common-rejection-reasons)

## Developer Account

- [ ] Google Play Developer account registered ($25 one-time fee)
- [ ] Identity verification completed (required since 2023)
- [ ] Payment profile set up for paid apps or IAP
- [ ] Organization details verified (if publishing as organization)
- [ ] Developer email and phone number verified

## Google Play Console Setup

- [ ] App created in Google Play Console
- [ ] Application ID (package name) set and matches project
- [ ] App signing key enrolled in Google Play App Signing (recommended)
- [ ] Upload key created and stored securely
- [ ] Internal testing track set up for initial testing
- [ ] Closed/open testing tracks configured as needed

## Build Configuration

- [ ] Version code incremented from last upload (android:versionCode)
- [ ] Version name updated (android:versionName)
- [ ] Release build signed with upload key (not debug key)
- [ ] ProGuard/R8 minification enabled for release builds
- [ ] App Bundle format (.aab) used instead of APK (required since August 2021)
- [ ] Target SDK version meets Google Play requirements (currently targetSdkVersion 34+ for new apps)
- [ ] Minimum SDK version set appropriately (minSdkVersion)
- [ ] 64-bit support included (required since August 2019)
- [ ] All native libraries compiled for required ABIs (arm64-v8a, armeabi-v7a, x86_64, x86)
- [ ] Deobfuscation mapping file (mapping.txt) uploaded for crash reporting
- [ ] No hardcoded API keys or secrets in the binary

## Privacy and Permissions

- [ ] Only necessary permissions declared in AndroidManifest.xml
- [ ] Runtime permissions requested at point of use (not all at launch)
- [ ] Permissions rationale shown before requesting (explain why)
- [ ] Data safety section completed accurately in Play Console:
  - Data collection disclosure
  - Data sharing disclosure
  - Security practices (encryption in transit, deletion mechanism)
- [ ] Privacy policy URL provided and accessible
- [ ] Accounts must offer deletion option (required since December 2023)
- [ ] QUERY_ALL_PACKAGES permission justified (if used)
- [ ] ACCESS_BACKGROUND_LOCATION justified and declared (if used)
- [ ] Foreground service types declared (android:foregroundServiceType, required for Android 14+)
- [ ] SCHEDULE_EXACT_ALARM justified (if used, restricted on Android 13+)
- [ ] Photo/video permissions use the new media permission model (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO on Android 13+)

## Store Listing Assets

- [ ] App icon: 512x512 PNG, 32-bit with alpha
- [ ] Feature graphic: 1024x500 PNG or JPG
- [ ] Screenshots provided (minimum 2, maximum 8 per device type):
  - Phone screenshots: 16:9 or 9:16 aspect ratio, min 320px, max 3840px per side
  - 7-inch tablet screenshots (if targeting tablets)
  - 10-inch tablet screenshots (if targeting tablets)
  - Chromebook screenshots (if targeting Chrome OS)
- [ ] Screenshots show actual app functionality
- [ ] Promotional video (optional, YouTube URL)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)

## Metadata and Compliance

- [ ] App name (max 30 characters, no performance claims or misleading keywords)
- [ ] App category selected
- [ ] Tags selected (up to 5)
- [ ] Contact email provided
- [ ] Contact phone number provided (recommended)
- [ ] Contact website URL provided (recommended)
- [ ] Content rating questionnaire completed (IARC)
- [ ] Target audience and content declaration completed
- [ ] Ads declaration accurate (does the app contain ads?)
- [ ] COVID-19 app declaration (if applicable)
- [ ] Government apps declaration (if applicable)
- [ ] Financial features declaration (if applicable)
- [ ] News app declaration (if applicable)
- [ ] Data safety form completed

## Technical Requirements

- [ ] No crashes on supported devices and API levels
- [ ] Tested on physical devices (not just emulator)
- [ ] Tested across multiple screen densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] App size optimized (APK/AAB base module, use dynamic feature modules for large apps)
- [ ] ANR (Application Not Responding) rate acceptable (<0.47%)
- [ ] Crash rate acceptable (<1.09%)
- [ ] Battery usage within acceptable limits (no excessive wakelocks)
- [ ] Background processing uses WorkManager (not deprecated services)
- [ ] Supports both light and dark themes (or gracefully handles)
- [ ] Handles configuration changes (rotation, keyboard, locale) without losing state
- [ ] Edge-to-edge display support (required for Android 15+)
- [ ] Predictive back gesture support (recommended for Android 14+)
- [ ] Per-app language preferences supported (recommended for Android 13+)
- [ ] Handles network errors gracefully (offline state, slow connections)
- [ ] Deep links and App Links verified
- [ ] Material Design guidelines followed where applicable

## In-App Purchases and Billing

(Skip if no IAP)

- [ ] Google Play Billing Library integrated (latest version)
- [ ] All products created in Play Console (one-time products, subscriptions)
- [ ] Purchase acknowledgement implemented within 3 days (required)
- [ ] Restore purchases / query existing purchases implemented
- [ ] Subscription management links provided
- [ ] Price clearly displayed before purchase
- [ ] Grace period and account hold handling implemented for subscriptions
- [ ] Real-time developer notifications configured (recommended)
- [ ] Tested with license testing accounts in Play Console

## Review Preparation

- [ ] Pre-launch report reviewed (automated testing by Google)
- [ ] Test account credentials provided in review notes (if login required)
- [ ] App access instructions documented (if special setup needed)
- [ ] Managed publishing enabled (if want to control release timing)
- [ ] Staged rollout percentage configured (recommended starting at 5-10%)
- [ ] Release notes written for this version

## Pre-Submission Testing

- [ ] Run through internal testing track with real users
- [ ] Test on oldest supported Android version
- [ ] Test on latest Android version
- [ ] Test on different screen sizes (phone, tablet if applicable)
- [ ] All deep links and App Links verified
- [ ] Push notifications tested (FCM)
- [ ] All localizations verified (if multi-language)
- [ ] Accessibility audit (TalkBack, Switch Access)
- [ ] Test with "Don't keep activities" developer option enabled
- [ ] Test with aggressive battery optimization enabled
- [ ] Android vitals baseline established in Play Console

## Common Rejection Reasons

1. **Impersonation**: App name, icon, or description too similar to existing app
2. **Misleading claims**: Description promises features not in the app
3. **Privacy violations**: Data collection not declared in Data Safety section
4. **Deceptive ads**: Ads that mimic system notifications or app UI
5. **Broken functionality**: Core features don't work, excessive crashes
6. **Restricted permissions**: Using sensitive permissions without justification
7. **Intellectual property**: Using copyrighted content without authorization
8. **Minimum functionality**: App is a simple webview wrapper without added value
9. **Payment policy**: Using non-Play billing for digital goods
10. **Missing account deletion**: No way for users to delete their account and data
