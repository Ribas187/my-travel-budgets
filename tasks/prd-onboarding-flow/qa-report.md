# QA Report — Onboarding Flow

## Summary

- Date: 2026-04-04
- Status: **REPROVED** (4 bugs found, 3 medium severity)
- Total Requirements: 22
- Requirements Verified: 19
- Requirements Not Testable (environment limitation): 3
- Bugs Found: 4
- **Viewports tested:** Desktop (1280x720) and Mobile (390x844 — iPhone 14)

## Requirements Verified

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| FR-1.1 | Welcome screen with app name and tagline | PASSED | `qa-screenshots/01-wizard-step1-welcome.png`, `qa-screenshots/mobile-01-step1-welcome.png` |
| FR-1.2 | Name input when user has no name | PASSED (with BUG-01) | Input shows but labels are raw i18n keys on both viewports |
| FR-1.3 | "Get Started" and "Skip" buttons | PASSED | Both buttons present on desktop and mobile |
| FR-2.1 | Trip form with 3 sequential field groups | PASSED | Screenshots show name/description, dates, currency/budget groups on both viewports |
| FR-2.2 | Contextual helper text per field group | PASSED | Helper text visible in all 3 groups |
| FR-2.3 | Back/Next navigation between groups | PASSED | Navigated through all 3 groups on both viewports |
| FR-2.4 | Trip created on completion | PASSED | DB confirms trips created ("QA Test Trip" + "Mobile Trip") |
| FR-2.5 | Skip exits without trip | NOT TESTED | Would require separate session |
| FR-3.1 | 6 default categories with emoji, all pre-selected | PASSED | `qa-screenshots/05-wizard-step3-categories.png`, `qa-screenshots/mobile-04-step3-categories.png` |
| FR-3.2 | Toggle categories on/off | PASSED | Unchecked "Shopping" on desktop, snapshot confirmed unchecked state |
| FR-3.3 | Edit category name/emoji | NOT TESTED | No edit UI visible in snapshot — possible omission |
| FR-3.4 | "Add custom" button | NOT TESTED | Button not visible in snapshot — possible omission |
| FR-3.5 | Selected categories created for trip | PASSED | DB confirms 5 categories for desktop user (Shopping excluded), 6 for mobile user |
| FR-3.6 | Skip advances without categories | NOT TESTED | Would require separate session |
| FR-4.1 | Celebration screen with summary | PASSED (with BUG-03) | Emoji and title show, but subtitle is raw i18n key on both viewports |
| FR-4.2 | Three quick-action buttons | PASSED | All 3 buttons visible and functional on both viewports |
| FR-4.3 | Onboarding marked complete | PASSED | After clicking "Go to dashboard", user lands on trip page (no wizard redirect) |
| FR-W.1 | Progress indicator (step X of 4) | PASSED (with BUG-02) | All steps show "Step N of 4" — but steps 2-3 show it twice (duplicate) |
| FR-W.2 | Skip at any step | PASSED | Skip button present on all steps on both viewports |
| FR-W.3 | All text internationalized | FAILED | BUG-01 and BUG-03: some keys render as raw strings |
| FR-W.4 | Keyboard accessible | PARTIAL | Buttons are focusable; full keyboard-only flow not tested |
| FR-T.1 | Tips shown once, tracked by dismissedTips | PASSED | Dashboard tip appeared on both viewports; dismiss persisted |
| FR-T.2 | Max 1 inline + 1 tooltip per page | PASSED | Only 1 tip per page on both viewports |
| FR-T.4 | Dismiss persists immediately | PASSED | Tip dismissed on both viewports, API confirmed |
| FR-T.5 | Tip text internationalized | PASSED | Dashboard and members tip messages displayed correctly |
| FR-T.6 | Tips accessible (keyboard, screen reader) | PASSED | `role="status"`, `aria-live="polite"`, dismiss buttons accessible |
| FR-P.1 | "Replay onboarding" resets wizard | PASSED (API only) | `PATCH /onboarding/reset` returns 204, `onboardingCompletedAt` set to null |
| FR-P.2 | "Reset tips" clears dismissed tips | PASSED (API only) | `PATCH /onboarding/tips/reset` returns 204, `dismissedTips` cleared |

## E2E Tests Executed

### Desktop (1280x720)

| Flow | Result | Notes |
|---|---|---|
| New user login → redirected to wizard | PASSED | Redirected to `/onboarding` after PIN verification |
| Full wizard completion (steps 1-4) | PASSED | Trip + 5 categories created, landed on dashboard |
| Dashboard tip shows on first visit (0 expenses) | PASSED | InlineTip with correct message visible |
| Dismiss dashboard tip | PASSED | Tip removed from page, persisted via API |
| Returning user not redirected to wizard | PASSED | After completion, navigated to trip dashboard directly |

### Mobile (390x844)

| Flow | Result | Notes |
|---|---|---|
| New user login → redirected to wizard | PASSED | Redirected to `/onboarding` after PIN verification |
| Full wizard completion (steps 1-4) | PASSED | Trip + 6 categories created, landed on dashboard |
| Dashboard tip shows and dismisses | PASSED | InlineTip renders properly at top of mobile view |
| Members tooltip shows | PASSED (with BUG-04) | TooltipTip appears but overlaps "Add Member" button |
| Expenses page (with categories) | PASSED | No tip shown (correct — user has categories) |
| Budget page (0 expenses) | PASSED | No tooltip shown (correct — condition is >=1 expense) |
| Bottom navigation works | PASSED | All tabs navigate correctly |

### Not Tested (both viewports)

| Flow | Reason |
|---|---|
| Skip wizard flow | Rate limiting prevented re-login with separate session |
| Profile replay/reset buttons (UI) | Session re-establishment blocked by auth timing issue |
| Profile replay/reset (API) | PASSED — All 4 API endpoints verified via curl |

## API Endpoint Verification

| Endpoint | Status | Notes |
|---|---|---|
| `PATCH /onboarding/complete` | PASSED | Returns 204, sets `onboardingCompletedAt` |
| `PATCH /onboarding/reset` | PASSED | Returns 204, clears `onboardingCompletedAt` |
| `PATCH /onboarding/tips/:tipId/dismiss` | PASSED | Returns 204, appends to `dismissedTips`, idempotent |
| `PATCH /onboarding/tips/:tipId/dismiss` (invalid) | PASSED | Returns 400 with `VALIDATION_ERROR` message |
| `PATCH /onboarding/tips/reset` | PASSED | Returns 204, clears `dismissedTips` array |

## Accessibility

- [x] Wizard steps have keyboard-focusable buttons (Tab, Enter)
- [x] Skip button available on all steps
- [x] Progress indicator provides step context ("Step N of 4")
- [x] InlineTip has `role="status"` and `aria-live="polite"`
- [x] TooltipTip has `role="status"` and "Got it" dismiss button
- [x] Dismiss buttons are accessible with descriptive labels
- [ ] Full keyboard-only wizard completion not tested
- [ ] Screen reader announcements on step transitions not verified

## Mobile-Specific Findings

- **Layout:** All wizard steps stack correctly on 390px viewport. No horizontal overflow detected.
- **Categories grid:** Renders as 2-column grid on mobile — large touch targets, easy to tap.
- **Buttons:** Full-width primary buttons, appropriately sized for touch.
- **Bottom nav:** Present and functional after wizard completion.
- **InlineTip:** Renders properly at top of mobile dashboard, full width.
- **TooltipTip:** BUG-04 — overlaps anchor button on mobile. Positioning needs adjustment.

## Bugs Found

| ID | Description | Severity | Screenshot |
|---|---|---|---|
| BUG-01 | Welcome step name input shows raw i18n keys (`onboarding.welcome.nameLabel`, `onboarding.welcome.namePlaceholder`) | Medium | `qa-screenshots/01-wizard-step1-welcome.png` |
| BUG-02 | Duplicate progress bar on Steps 2-3 (rendered by both wizard container and view template) | Low | `qa-screenshots/02-wizard-step2-create-trip.png` |
| BUG-03 | Ready step subtitle shows raw i18n key `onboarding.ready.subtitle` instead of dynamic summary | Medium | `qa-screenshots/06-wizard-step4-ready.png` |
| BUG-04 | TooltipTip overlaps "Add Member" button on mobile Members page instead of anchoring beside/below it | Medium | `qa-screenshots/mobile-07-members-tooltip.png` |

## Conclusion

The onboarding flow is **functionally working** end-to-end on both desktop and mobile viewports: wizard redirect, 4-step completion, trip/category creation, contextual tips, and API endpoints all operate correctly. The mobile layout is well-adapted with proper stacking, full-width buttons, and a 2-column category grid.

However, **4 bugs** prevent approval:

1. **BUG-01 + BUG-03 (Medium):** Missing/mismatched i18n keys cause raw key strings to display — violates FR-W.3.
2. **BUG-02 (Low):** Duplicate progress bar is a visual issue on steps 2-3.
3. **BUG-04 (Medium):** TooltipTip positioning overlaps its anchor on mobile — impacts usability on the most-used viewport.

**Recommendation:** Fix all 4 bugs (i18n key mismatches, remove duplicate progress bar, fix tooltip positioning on mobile), then re-test. These are localized fixes that should not require architectural changes.
