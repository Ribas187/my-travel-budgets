# Product Requirements Document — Onboarding Flow

## Overview

New users of My Travel Budgets face a cold-start problem: after signing up, they land on an empty travels page with no guidance on what to do first. They must independently discover that they need to create a trip, then add categories, before they can log any expenses. This friction increases drop-off and delays the moment users experience value.

This feature introduces a **hybrid onboarding system** consisting of:

1. **Welcome Wizard** — A linear, 4-step guided flow shown on first login that walks users through creating their first trip and categories.
2. **Contextual Tips** — Inline cards and tooltips that appear progressively as users explore features for the first time, teaching functionality in context.

Together, these reduce time-to-value by eliminating the discovery gap and teaching features incrementally without overwhelming new users.

## Goals

- **Reduce time-to-first-expense:** Guide new users from signup to their first logged expense with minimal friction.
- **Eliminate cold-start confusion:** Ensure every new user understands the trip > categories > expenses flow before they encounter an empty state.
- **Teach features progressively:** Surface feature explanations at the moment of relevance rather than front-loading all information.
- **Maintain user autonomy:** The wizard must be fully skippable; contextual tips must be individually dismissible. No feature gating.
- **Support both platforms:** Deliver a consistent onboarding experience on web and mobile (web first).

*Note: Analytics and funnel tracking are explicitly deferred to a future iteration.*

## User Stories

### New User — First Login

- As a new user, I want to be guided through creating my first trip so that I don't have to figure out the app structure on my own.
- As a new user, I want suggested categories pre-selected for me so that I can start logging expenses immediately without setup overhead.
- As a new user who only has an email (from magic link), I want to set my display name during onboarding so that my profile is complete from the start.
- As a new user in a hurry, I want to skip the wizard at any point so that I can explore the app on my own terms.

### New User — Exploring Features

- As a new user visiting the dashboard for the first time with no expenses, I want to see a helpful tip explaining what the dashboard shows so that I understand why it's empty.
- As a new user on the expenses page without categories, I want to be told I need categories first (with a direct link) so that I'm not stuck.
- As a new user, I want tips to appear only once per feature and never stack on top of each other so that they feel helpful, not annoying.

### Returning User

- As a returning user, I want to replay the onboarding wizard from my profile settings so that I can revisit the guided setup.
- As a returning user, I want to re-enable all dismissed tips from my profile settings so that I can see feature explanations again.

## Core Features

### 1. Welcome Wizard

A full-screen, 4-step linear flow that replaces the default redirect for first-time users. The wizard is **blocking with skip**: authenticated users whose onboarding is not complete are redirected to the wizard, but can skip at any step.

**Step 1 — Welcome**

- FR-1.1: Display a welcome screen with the app name and tagline.
- FR-1.2: If the user has no display name set, show a name input field prompting "What should we call you?" and persist the name on submission.
- FR-1.3: Provide a "Get Started" button to advance and a "Skip" link to exit the wizard entirely.

**Step 2 — Create Your Trip**

- FR-2.1: Present the trip creation form with fields grouped sequentially: (a) name + description, (b) start/end dates, (c) currency + budget.
- FR-2.2: Show contextual helper text for each field group to guide input.
- FR-2.3: Allow back/next navigation between field groups within this step.
- FR-2.4: On completion, create the trip and advance to step 3.
- FR-2.5: "Skip" exits the wizard without creating a trip.

**Step 3 — Pick Categories**

- FR-3.1: Display a grid of 6 default categories (Food, Transport, Accommodation, Activities, Shopping, Other), each with an emoji and name, all pre-selected.
- FR-3.2: Allow toggling categories on/off by tapping the card.
- FR-3.3: Allow editing a category's name or emoji by tapping it.
- FR-3.4: Provide an "Add custom" button to create additional categories beyond the defaults.
- FR-3.5: On completion, create all selected categories for the trip created in step 2.
- FR-3.6: "Skip" advances to step 4 without creating any categories.

**Step 4 — You're Ready!**

- FR-4.1: Display a celebration screen summarizing what was created (trip name, number of categories).
- FR-4.2: Provide three quick-action buttons: "Add your first expense", "Invite members", and "Go to dashboard".
- FR-4.3: Mark the user's onboarding as complete.

**General Wizard Requirements**

- FR-W.1: Show a progress indicator reflecting the current step (1–4).
- FR-W.2: Skipping at any step marks onboarding as complete and redirects to the travels list.
- FR-W.3: All wizard text must be internationalized (no hardcoded strings).
- FR-W.4: The wizard must be accessible via keyboard navigation and screen readers (WCAG 2.1 AA).

### 2. Contextual Tips

Inline cards and tooltips that appear once per feature, on first visit, to teach functionality in context.

**Tip Catalog**

| ID | Type | Location | Condition | Message Summary |
|---|---|---|---|---|
| `dashboard_first_visit` | Inline card | Dashboard | First visit, 0 expenses | Explains dashboard purpose |
| `expenses_no_categories` | Inline card | Expenses | No categories exist | Prompts to create categories first (with CTA) |
| `summary_first_visit` | Inline card | Summary | First visit to summary | Explains summary insights |
| `budget_progress_bar` | Tooltip | Budget | First visit, >=1 expense | Explains color coding |
| `members_invite_button` | Tooltip | Members | First visit | Explains invite functionality |
| `category_budget_limit` | Tooltip | Categories | First category edit | Explains budget limit feature |

**Functional Requirements**

- FR-T.1: Each tip is shown at most once per user, tracked by a list of dismissed tip IDs on the user profile.
- FR-T.2: A maximum of 1 inline card and 1 tooltip may be visible per page at any time (no stacking).
- FR-T.3: Tips animate in (fade + slide up) and out on dismiss.
- FR-T.4: Dismissing a tip persists the dismissal immediately and optimistically updates the UI.
- FR-T.5: All tip text must be internationalized.
- FR-T.6: Tips must be accessible — dismissible via keyboard, announced by screen readers.

### 3. Profile Settings

- FR-P.1: Provide a "Replay onboarding" button in profile settings that resets the wizard completion state. The next navigation triggers the wizard redirect.
- FR-P.2: Provide a "Reset tips" button in profile settings that clears all dismissed tips, causing them to appear again on their respective pages.

## User Experience

### Personas

- **First-time traveler:** New to the app and to group expense tracking. Needs hand-holding through the trip setup flow.
- **Experienced user, new to app:** Understands expense splitting but needs to learn this specific tool. May skip the wizard but benefit from contextual tips.
- **Returning user:** Has completed onboarding but wants a refresher. Uses profile settings to replay.

### Key Flows

1. **First login flow:** Sign up/sign in -> Redirected to wizard -> Complete or skip -> Land on travels list or new trip dashboard.
2. **Contextual tip flow:** Visit a page for the first time -> See relevant tip -> Dismiss or interact with CTA -> Tip never shown again.
3. **Replay flow:** Go to profile settings -> Tap "Replay onboarding" -> Next navigation redirects to wizard.

### UI/UX Considerations

- The wizard should feel lightweight and fast — no unnecessary friction or loading states between steps.
- Step 3 (categories) uses a visual grid with emojis for quick scanability.
- Step 4 (completion) should feel celebratory — use illustration or animation to reward completion.
- Contextual tips should be visually subtle (soft background, small footprint) so they inform without interrupting.
- Tooltips must auto-position relative to their anchor element (top/bottom/left/right based on available space).

### Accessibility

- All wizard steps and tips must be navigable via keyboard (Tab, Enter, Escape to dismiss).
- Screen reader announcements for step transitions and tip appearances.
- Sufficient color contrast on all text and interactive elements (WCAG 2.1 AA).
- Focus management: focus should move to the wizard content on load and to tip content when a tip appears.

## High-Level Technical Constraints

- **i18n required:** All user-facing text must use the existing i18n system with keys in both `en.json` and `pt-BR.json`.
- **Platform strategy:** Web implementation first, then mobile (Expo). Onboarding state, tip IDs, default categories, and i18n keys must be shareable across platforms.
- **Existing API reuse:** Trip creation and category creation must use the existing API endpoints — no new batch endpoints.
- **User model extension:** The user profile must be extended with onboarding completion state and dismissed tip tracking.
- **No feature gating:** Completing or skipping onboarding must not restrict access to any app functionality.

## Out of Scope

- **Analytics and funnel tracking:** No metrics collection, A/B testing, or conversion tracking in this iteration.
- **Marketing or promotional content:** The wizard is purely functional guidance, not a marketing channel.
- **Feature gating:** No features are locked behind onboarding completion.
- **Onboarding for existing users:** Only new users (those who have never completed onboarding) see the wizard. No migration flow for current users.
- **Custom onboarding paths:** All users see the same wizard flow — no role-based or segment-based variations.
- **Offline support:** Onboarding requires an active connection; offline handling is not in scope.
