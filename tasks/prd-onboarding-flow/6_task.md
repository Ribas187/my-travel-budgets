# Task 6.0: Wizard Step Views (UI Templates)

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Create four UI template components in `@repo/ui` for each wizard step. These are presentation-only components that receive data and callbacks as props. All text uses i18n keys.

<skills>
### Standard Skills Compliance

- `tamagui` — Styled components, design tokens, responsive design
- `atomic-design-fundamentals` — Templates layer
- `react` — Functional components, prop types
</skills>

<requirements>
- `OnboardingWelcomeView` — Welcome screen with optional name input (FR-1.1, FR-1.2, FR-1.3)
- `OnboardingTripFormView` — Trip creation with 3 field groups, back/next navigation (FR-2.1–FR-2.5)
- `OnboardingCategoriesView` — Grid of 6 default categories, toggleable, editable, "Add custom" (FR-3.1–FR-3.6)
- `OnboardingReadyView` — Celebration screen with summary and 3 quick-action buttons (FR-4.1–FR-4.3)
- All views include progress indicator prop (step X of 4) (FR-W.1)
- All views include "Skip" button/link (FR-W.2)
- All text via i18n — no hardcoded strings (FR-W.3)
- Keyboard accessible (FR-W.4)
</requirements>

## Subtasks

- [x] 6.1 Create `src/packages/ui/src/templates/OnboardingWelcomeView/OnboardingWelcomeView.tsx` — welcome screen with conditional name input
- [x] 6.2 Create `src/packages/ui/src/templates/OnboardingTripFormView/OnboardingTripFormView.tsx` — trip form with 3 field groups and back/next
- [x] 6.3 Create `src/packages/ui/src/templates/OnboardingCategoriesView/OnboardingCategoriesView.tsx` — category grid with toggle, edit, add custom
- [x] 6.4 Create `src/packages/ui/src/templates/OnboardingReadyView/OnboardingReadyView.tsx` — celebration with summary and quick actions
- [x] 6.5 Create a shared `OnboardingProgressBar` atom or molecule for step progress indication
- [x] 6.6 All views use `useTranslation()` and i18n keys from `@repo/core`
- [x] 6.7 Export all views from `@repo/ui` barrel
- [x] 6.8 Write component tests

## Implementation Details

Refer to **techspec.md** sections:
- "UI Component Design" — Wizard Step Components
- "Wizard State Management" — Step transitions (containers handle this, views just render)

Follow existing template patterns in `src/packages/ui/src/templates/` (e.g., `TripFormView`). Views are presentation-only — they receive form state, handlers, and callbacks as props. The container (task 7.0) manages API calls and step transitions.

For the trip form in step 2, reuse existing form atoms (`FormField`, `FormInput`, `DatePickerInput`, etc.) from `@repo/ui`.

For the category grid in step 3, use the `DEFAULT_CATEGORIES` constant from `@repo/core`. Each card should show emoji + translated name, with a checkbox/toggle visual.

## Success Criteria

- All 4 views render correctly with proper i18n text
- Progress indicator shows correct step
- Skip button is present on all views
- WelcomeView conditionally shows name input based on prop
- TripFormView navigates between 3 field groups
- CategoriesView renders 6 toggleable category cards
- ReadyView shows summary and 3 action buttons
- All keyboard accessible

## Task Tests

- [x] Unit tests: OnboardingWelcomeView renders title and subtitle, shows name input when `showNameInput` is true
- [x] Unit tests: OnboardingTripFormView renders field groups, back/next buttons work
- [x] Unit tests: OnboardingCategoriesView renders 6 categories, toggling calls callback
- [x] Unit tests: OnboardingReadyView renders summary text and 3 action buttons
- [x] Unit tests: All views render Skip button that calls `onSkip` callback
- [x] Unit tests: Progress bar shows correct step number

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/packages/ui/src/templates/TripFormView/` — Reference pattern for form views
- `src/packages/ui/src/atoms/` — FormField, FormInput, PrimaryButton, etc.
- `src/packages/ui/src/molecules/` — DatePickerInput, ColorPicker, EmojiPicker
- `src/packages/core/src/constants/default-categories.ts` — DEFAULT_CATEGORIES (from task 1.0)
- `src/packages/core/src/i18n/en.json` — i18n keys (from task 1.0)
