# Bugs — Onboarding Flow

## BUG-01: Missing i18n keys on Welcome step (name label and placeholder)

- **Severity:** Medium
- **Location:** Wizard Step 1 (Welcome)
- **Description:** The name input label displays raw i18n key `onboarding.welcome.nameLabel` and placeholder shows `onboarding.welcome.namePlaceholder` instead of translated text. The title and subtitle translate correctly, so these specific keys are missing from the translation files or are not matching the keys used by the component.
- **Screenshot:** `qa-screenshots/01-wizard-step1-welcome.png`
- **Expected:** "What should we call you?" (label) and a placeholder like "Your name"
- **Actual:** Raw key strings displayed
- **Status:** Fixed
- **Applied fix:** Changed `OnboardingWizard.tsx` to use `onboarding.welcome.namePrompt` (which exists in i18n files) instead of `onboarding.welcome.nameLabel` (which doesn't exist).
- **Regression tests:** Visual verification via Playwright — `qa-screenshots/fix-01-welcome-i18n.png` confirms "What should we call you?" renders correctly.

## BUG-02: Duplicate progress bar on Step 2

- **Severity:** Low
- **Location:** Wizard Steps 2-3 (Create Your Trip, Pick Categories)
- **Description:** The progress bar ("Step 2 of 4") renders twice — once from the outer wizard container and once from the `OnboardingTripFormView` template. This causes a duplicated "Step 2 of 4" label and two progress indicator bars at the top of the screen.
- **Screenshot:** `qa-screenshots/02-wizard-step2-create-trip.png`
- **Expected:** Single progress bar at the top
- **Actual:** Two progress bars stacked
- **Status:** Fixed
- **Applied fix:** Removed `<OnboardingProgressBar>` from `OnboardingTripFormView.tsx` and `OnboardingCategoriesView.tsx`. The wizard container (`OnboardingWizard.tsx`) is the single source of the progress bar for all steps.
- **Regression tests:** Visual verification via Playwright — `qa-screenshots/fix-02-no-duplicate-progress.png` shows single progress bar on step 2.

## BUG-03: Missing i18n key on Ready step (subtitle)

- **Severity:** Medium
- **Location:** Wizard Step 4 (You're Ready!)
- **Description:** The subtitle shows raw i18n key `onboarding.ready.subtitle` instead of the expected summary text like "You created **QA Test Trip** with **5 categories**". The key likely requires interpolation variables (`tripName`, `categoryCount`) that are not being passed, or the key itself is missing/mismatched.
- **Screenshot:** `qa-screenshots/06-wizard-step4-ready.png`
- **Expected:** Dynamic summary with trip name and category count
- **Actual:** Raw key string `onboarding.ready.subtitle`
- **Status:** Fixed
- **Applied fix:** Changed `OnboardingWizard.tsx` to use `onboarding.ready.summary` (which exists in i18n files with `{{tripName}}` and `{{count}}` interpolation) instead of `onboarding.ready.subtitle` (which doesn't exist). Also fixed interpolation variable from `categoryCount` to `count` to match the i18n template. Replaced non-existent `onboarding.ready.skipSubtitle` fallback with `onboarding.ready.title`.
- **Regression tests:** Visual verification via Playwright — `qa-screenshots/fix-03-ready-summary.png` shows "You created **Verify Trip** with **6 categories**".

## BUG-04: TooltipTip overlaps its anchor element on mobile

- **Severity:** Medium
- **Location:** Members page — `members_invite_button` tooltip
- **Description:** The TooltipTip for the invite button overlaps and partially covers the "Add Member" button it refers to, rather than positioning below or beside it. The tooltip text and "Got it" dismiss button work correctly, but the overlap makes the anchor button inaccessible while the tooltip is visible.
- **Screenshot:** `qa-screenshots/mobile-07-members-tooltip.png`
- **Expected:** Tooltip positioned below or beside the "Add Member" button without overlap
- **Actual:** Tooltip overlaps the button, partially obscuring it
- **Status:** Fixed (code change applied, visual verification blocked by auth timing issue)
- **Applied fix:** Two changes: (1) In `TooltipTip.tsx`, improved positioning logic to center the tooltip horizontally on the anchor element and clamp to viewport edges with 12px padding, preventing overflow. (2) In `MembersView.tsx`, wrapped the "Add Member" `PrimaryButton` in a `View` with the `inviteButtonRef` attached, so the anchor ref actually points to the correct DOM element.
- **Regression tests:** Code-level — ref is now properly attached and positioning uses `anchorCenter - tooltipWidth / 2` with viewport clamping. Visual verification requires manual testing due to Playwright auth session limitation.
