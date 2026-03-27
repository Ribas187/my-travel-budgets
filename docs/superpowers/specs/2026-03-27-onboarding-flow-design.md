# Onboarding Flow — Design Spec

## Overview

A hybrid onboarding system for My Travel Budgets: a linear welcome wizard on first login that guides users through creating their first trip, plus contextual tips that appear as users explore features for the first time.

**Goals:**
- Reduce time-to-value for new users by guiding them through trip + category creation
- Eliminate the friction of discovering that categories must exist before expenses
- Teach features progressively without overwhelming users upfront

**Non-goals:**
- Marketing/promotional content
- Feature gating behind onboarding completion
- Analytics or funnel tracking (can be added later)

## Architecture: Hybrid Approach

### Welcome Wizard (Linear, 4 Steps)

Full-screen step-by-step flow that replaces the initial redirect to `/travels` for first-time users. Each step is a dedicated screen with a progress indicator. Fully skippable at any point.

### Contextual Tips (Progressive, Post-Onboarding)

Inline cards and tooltips that appear once per feature, on first visit. Dismissible individually. Can be re-enabled from Profile settings.

## Welcome Wizard — Screen Details

### Step 1: Welcome

- Full-screen layout with illustration/animation at top
- Headline: "Welcome to My Travel Budgets" (`onboarding.welcome.title`)
- Subtitle: "Track and split travel expenses with friends" (`onboarding.welcome.subtitle`)
- If user has no `name` set (only email from magic link): show name input ("What should we call you?")
  - Calls `PATCH /users/me` to save the name
- Buttons: "Get Started" (primary), "Skip" (text link)
- **Skip behavior:** sets `onboardingCompletedAt`, redirects to `/travels`

### Step 2: Create Your Trip

- Progress bar: step 2 of 4
- Standard trip creation form, presented one field group at a time:
  1. Trip name + description — helper: "Give your trip a name, like 'Summer in Italy'"
  2. Start/end dates — helper: "When are you traveling?"
  3. Currency + budget — helper: "Set your spending currency and total budget"
- "Back" / "Next" navigation between field groups
- **Skip behavior:** sets `onboardingCompletedAt`, redirects to `/travels` (no trip created)
- **On completion:** creates trip via existing `POST /travels` API, advances to step 3

### Step 3: Pick Categories

- Grid of 6 suggested categories, all pre-checked:
  - Food 🍔, Transport 🚕, Accommodation 🏨, Activities 🎯, Shopping 🛍️, Other 📦
- Each category card shows emoji + name, toggleable on/off
- Tap a category to edit its name or emoji
- "Add custom" button to create additional categories
- **Skip behavior:** no categories created, advances to step 4
- **On completion:** creates each selected category via the existing `POST /travels/:id/categories` endpoint (one call per category, sequential). No new batch endpoint needed.

### Step 4: You're Ready!

- Celebration illustration/animation
- Summary text: "You created **[trip name]** with **[N] categories**"
- Three quick-action buttons:
  - "Add your first expense" → `/travels/:id/expenses`
  - "Invite members" → `/travels/:id/members`
  - "Go to dashboard" → `/travels/:id`
- Sets `onboardingCompletedAt` on the user via `PATCH /users/me/onboarding`

## Contextual Tips

### Tip Types

Two reusable components in `@repo/ui`:

- **InlineTip** — Dismissible card with icon, text, and optional CTA button. Renders at the top of a page section. Subtle background, "X" to dismiss.
- **TooltipTip** — Small bubble anchored to a specific UI element. Appears on first render with auto-positioning (top/bottom/left/right). "Got it" button to dismiss.

### Tip Catalog

| Tip ID | Type | Page | Trigger Condition | Message |
|---|---|---|---|---|
| `dashboard_first_visit` | Inline | Dashboard | First visit with 0 expenses | "Your dashboard shows spending by person and category. Add expenses to see insights here." |
| `expenses_no_categories` | Inline | Expenses | User has no categories | "Create categories first to organize your expenses." + CTA: "Go to Categories" |
| `summary_first_visit` | Inline | Summary | First visit to summary page | "Trip summary shows insights like top spender, biggest category, and daily averages once you have expenses." |
| `budget_progress_bar` | Tooltip | Budget | First visit with ≥1 expense | "Green = on track, amber = 80%+ spent, red = over budget." Points to progress bar. |
| `members_invite_button` | Tooltip | Members | First visit to members page | "Invite friends to split expenses. They'll need an account to join." Points to invite button. |
| `category_budget_limit` | Tooltip | Categories | First time editing a category | "Set a budget limit per category to get alerts when you're overspending." Points to budget limit field. |

### Behavior Rules

- Each tip shows once per user (tracked by `dismissedTips` on the user model)
- Max 1 inline card + 1 tooltip visible per page at a time (no stacking)
- Tips animate in (fade + slight slide up) and out on dismiss
- Dismissing a tip calls `PATCH /users/me/tips/:tipId/dismiss`
- All tip text uses i18n — no hardcoded strings

## Data Model

### User Model Additions

```
onboardingCompletedAt  DateTime?   — null means wizard not completed
dismissedTips          String[]    — list of dismissed tip IDs
```

### Tip ID Constants

Defined in `@repo/core` as a union type / enum:

```typescript
type OnboardingTipId =
  | 'dashboard_first_visit'
  | 'expenses_no_categories'
  | 'summary_first_visit'
  | 'budget_progress_bar'
  | 'members_invite_button'
  | 'category_budget_limit';
```

## API Endpoints

### Onboarding

- `PATCH /users/me/onboarding` — Mark wizard as complete (sets `onboardingCompletedAt` to now)

### Tips

- `PATCH /users/me/tips/:tipId/dismiss` — Add tip ID to `dismissedTips`
- `PATCH /users/me/tips/reset` — Clear `dismissedTips` array (re-enable all tips)

### Existing Endpoints Used

- `PATCH /users/me` — Update user name (step 1)
- `POST /travels` — Create trip (step 2)
- `POST /travels/:id/categories` — Create categories (step 3)
- `GET /users/me` — Fetch user profile including `onboardingCompletedAt` and `dismissedTips`

## Frontend Routing & Logic

### Wizard Route

- Route: `/onboarding` (under `/_authenticated` layout)
- Redirect logic in AuthProvider: if `onboardingCompletedAt` is null → redirect to `/onboarding`
- Wizard manages internal step state (1–4), not URL-based sub-routes
- On skip or completion: sets onboarding complete, redirects to `/travels` or the created trip

### Contextual Tips

- A `useTip(tipId)` hook in `@repo/features` that:
  - Reads `dismissedTips` from user context
  - Returns `{ shouldShow: boolean, dismiss: () => void }`
  - `dismiss()` calls the API and updates local state optimistically

### Profile Settings

- "Replay onboarding" button — calls `PATCH /users/me/onboarding` to reset `onboardingCompletedAt` to null; next navigation triggers wizard redirect
- "Reset tips" button — calls `PATCH /users/me/tips/reset`; all contextual tips show again

## i18n Keys

All onboarding text must be added to both `en.json` and `pt-BR.json` in `@repo/core/src/i18n/`.

Key namespace: `onboarding.*`

```
onboarding.welcome.title
onboarding.welcome.subtitle
onboarding.welcome.namePrompt
onboarding.welcome.getStarted
onboarding.welcome.skip
onboarding.createTrip.title
onboarding.createTrip.nameHelper
onboarding.createTrip.datesHelper
onboarding.createTrip.budgetHelper
onboarding.categories.title
onboarding.categories.subtitle
onboarding.categories.addCustom
onboarding.ready.title
onboarding.ready.summary
onboarding.ready.addExpense
onboarding.ready.inviteMembers
onboarding.ready.goToDashboard
onboarding.tip.dashboardFirstVisit
onboarding.tip.expensesNoCategories
onboarding.tip.expensesNoCategoriesCta
onboarding.tip.summaryFirstVisit
onboarding.tip.budgetProgressBar
onboarding.tip.membersInviteButton
onboarding.tip.categoryBudgetLimit
onboarding.tip.dismiss
onboarding.profile.replayOnboarding
onboarding.profile.resetTips
```

## Default Categories

Defined in `@repo/core` as a constant array, used by both the onboarding wizard and potentially future "reset to defaults" features:

```typescript
const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Transport', icon: '🚕', color: '#3b82f6' },
  { name: 'Accommodation', icon: '🏨', color: '#8b5cf6' },
  { name: 'Activities', icon: '🎯', color: '#10b981' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];
```

Category names are i18n keys (`onboarding.defaultCategory.food`, etc.) resolved at render time.

## Platform Strategy

Per project rules: implement Web first, then Mobile.

- **Web:** Full wizard at `/onboarding` route, InlineTip and TooltipTip components
- **Mobile (Expo):** Same wizard as a stack of screens, same tip components adapted for native (bottom sheet for tooltips instead of anchored bubbles)
- **Shared:** Onboarding state, tip IDs, default categories, i18n keys — all in `@repo/core`. Tip logic hook in `@repo/features`.
