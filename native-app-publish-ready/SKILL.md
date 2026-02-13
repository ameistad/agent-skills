---
name: native-app-publish-ready
description: Comprehensive app store submission readiness checker for mobile apps. Audits iOS App Store and Google Play Store requirements including build config, privacy compliance, store assets, metadata, technical requirements, and common rejection causes. Use when the user asks to "check if my app is ready to submit", "review for app store", "app store checklist", "pre-submission check", "ready for Play Store", "ready for App Store", "submission readiness", or wants to audit a mobile app before publishing. Supports native iOS (Swift/ObjC), native Android (Kotlin/Java), Flutter, and React Native (including Expo) projects.
---

# App Store Readiness

Audit a mobile app project for app store submission readiness. Detect the project type automatically and check against platform-specific requirements for the Apple App Store and Google Play Store.

## Workflow

1. Detect project type and target platforms
2. Run the automated scanner
3. Load relevant platform checklist(s) and review results
4. Walk through items that cannot be automated
5. Produce a final readiness report

### Step 1: Detect and Scan

Run the scanner to auto-detect framework and platforms and perform automated checks:

```bash
python3 <skill-path>/scripts/check_project.py <project-root>
```

Output: JSON with `project_type` (framework + platforms), `summary` (error/warning/pass counts), and `issues` array.

### Step 2: Load Platform Checklists

Based on detected project type, read the relevant reference files for the full checklist:

| Detected | Read |
|---|---|
| iOS target | `references/ios.md` |
| Android target | `references/android.md` |
| Flutter framework | Also `references/flutter.md` |
| React Native framework | Also `references/react-native.md` |

Each reference file contains a complete checklist organized by category. Use these to supplement the automated scan with manual review items.

### Step 3: Review Automated Results

Present scanner results grouped by severity:

1. **Errors** (blockers) - Must fix before submission
2. **Warnings** (risks) - Likely to cause rejection or should be addressed
3. **Passed** - Checks that look good

### Step 4: Manual Review

Walk through critical items that cannot be verified by scanning files alone:

**Store Assets and Metadata**
- Screenshots for all required device sizes
- App description, keywords, promotional text within character limits
- Privacy policy URL live and accessible
- Support URL or email functional
- Age rating questionnaire accuracy

**Testing**
- Tested on physical devices
- Tested on oldest and newest supported OS versions
- In-app purchases tested in sandbox (if applicable)
- Push notifications verified end-to-end
- Deep links and universal links working

**Legal and Compliance**
- Privacy policy hosted and URL submitted
- Data collection declarations match actual behavior
- ATT prompt before tracking (iOS)
- Account deletion offered (required by both stores)
- COPPA compliance if targeting children

**App Review Preparation**
- Demo account credentials ready (if login required)
- Review notes for non-obvious features
- Contact information current

### Step 5: Produce Report

Summarize findings using this structure:

```
# App Store Readiness Report

**Project:** [name]
**Framework:** [detected] | **Platforms:** [ios/android]
**Date:** [date]

## Blockers (must fix before submission)
- ...

## Warnings (address before submission)
- ...

## Manual Checklist
- [ ] [items requiring human verification]

## Passed
- ...

## Recommendation
[Ready to submit / Not ready, N blockers remain]
```
