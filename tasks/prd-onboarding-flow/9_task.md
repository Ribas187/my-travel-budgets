# Task 9.0: Profile Settings (Replay & Reset)

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Add "Replay onboarding" and "Reset tips" buttons to the profile settings page. These allow returning users to re-experience the wizard or re-enable all contextual tips.

<skills>
### Standard Skills Compliance

- `react` — Event handlers, mutation hooks
- `tamagui` — Button components, layout
</skills>

<requirements>
- "Replay onboarding" button calls `PATCH /onboarding/complete` to reset `onboardingCompletedAt` to null (note: the existing `clearOnboardingCompleted` method in the repository handles this). On next navigation, `_authenticated` `beforeLoad` redirects to wizard.
- "Reset tips" button calls `PATCH /onboarding/tips/reset` to clear all dismissed tips
- Both buttons show confirmation or success feedback (toast)
- Both use i18n keys for button labels
- Buttons are placed in a new "Onboarding" section in the profile page
</requirements>

## Subtasks

- [x] 9.1 Add a new API client method or hook for resetting onboarding (clearing `onboardingCompletedAt`)—this may need a new endpoint `PATCH /onboarding/reset` or reuse existing `clearOnboardingCompleted` via the complete endpoint with a toggle
- [x] 9.2 Add "Onboarding" section to the profile page with "Replay onboarding" and "Reset tips" buttons
- [x] 9.3 "Replay onboarding" calls the reset endpoint, invalidates user cache, shows toast
- [x] 9.4 "Reset tips" calls `useResetTips` mutation, shows toast
- [x] 9.5 Use i18n keys: `onboarding.profile.replayOnboarding`, `onboarding.profile.resetTips`
- [x] 9.6 Write tests

## Implementation Details

Refer to **techspec.md** sections:
- PRD "Profile Settings" — FR-P.1 and FR-P.2

**Important:** The tech spec's `IOnboardingRepository` has `clearOnboardingCompleted` but the controller only has `PATCH /onboarding/complete` which sets the timestamp. You may need to add a `PATCH /onboarding/reset` endpoint to clear `onboardingCompletedAt`, or modify the complete endpoint to support toggling. Check the existing `OnboardingController` (from task 2.0) and add a reset endpoint if needed.

Follow the existing profile page pattern in `src/apps/web/src/features/profile/` or `src/packages/features/src/`.

## Success Criteria

- "Replay onboarding" resets wizard state; next navigation redirects to `/onboarding`
- "Reset tips" clears all dismissed tips; tips reappear on their pages
- Both buttons show success feedback
- Buttons use i18n text

## Task Tests

- [x] Unit tests: Profile page renders "Replay onboarding" and "Reset tips" buttons
- [x] Unit tests: Clicking "Replay onboarding" calls the reset mutation
- [x] Unit tests: Clicking "Reset tips" calls `useResetTips` mutation
- [x] Integration tests: After replaying, user is redirected to wizard on next navigation

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/apps/web/src/features/profile/ProfilePage.tsx` or `src/packages/features/src/` — Profile page
- `src/packages/api-client/src/hooks/onboarding/` — Mutation hooks (from task 3.0)
- `src/packages/ui/src/templates/ProfileView/` — Profile UI template
- `src/apps/api/src/modules/onboarding/` — May need new endpoint (from task 2.0)
