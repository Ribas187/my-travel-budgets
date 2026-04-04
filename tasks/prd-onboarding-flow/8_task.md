# Task 8.0: Contextual Tips Integration

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Wire the `useTip` hook with `InlineTip` and `TooltipTip` components into 6 existing pages. Each page gets at most 1 inline card or 1 tooltip based on the tip catalog in the PRD.

<skills>
### Standard Skills Compliance

- `react` — Hooks integration, conditional rendering
- `tamagui` — Component composition
</skills>

<requirements>
- Add `dashboard_first_visit` InlineTip to DashboardPage (condition: 0 expenses)
- Add `expenses_no_categories` InlineTip to expenses page (condition: no categories, with CTA to categories)
- Add `summary_first_visit` InlineTip to TripSummaryPage (condition: first visit)
- Add `budget_progress_bar` TooltipTip to budget page (condition: >=1 expense, anchored to progress bar)
- Add `members_invite_button` TooltipTip to MembersPage (condition: first visit, anchored to invite button)
- Add `category_budget_limit` TooltipTip to CategoriesPage (condition: first category edit, anchored to budget field)
- Max 1 inline + 1 tooltip visible per page (no stacking rule — enforced by only placing 1 of each type per page)
- All tip text uses i18n keys
</requirements>

## Subtasks

- [x] 8.1 Add `dashboard_first_visit` InlineTip to `src/packages/features/src/dashboard/DashboardPage.tsx` — shown when expenses count is 0
- [x] 8.2 Add `expenses_no_categories` InlineTip to expenses feature — shown when categories list is empty, CTA navigates to categories
- [x] 8.3 Add `summary_first_visit` InlineTip to `src/packages/features/src/summary/TripSummaryPage.tsx`
- [x] 8.4 Add `budget_progress_bar` TooltipTip to budget feature — anchored to budget progress bar element
- [x] 8.5 Add `members_invite_button` TooltipTip to `src/packages/features/src/members/MembersPage.tsx` — anchored to invite button
- [x] 8.6 Add `category_budget_limit` TooltipTip to `src/packages/features/src/categories/CategoriesPage.tsx` — anchored to budget limit field
- [x] 8.7 Write tests for each integration

## Implementation Details

Refer to **techspec.md** sections:
- "UI Component Design" — Tip types per page
- PRD "Tip Catalog" table — Conditions and messages for each tip

Pattern for each integration:
```tsx
const { shouldShow, dismiss } = useTip('dashboard_first_visit');
// ... in JSX:
{shouldShow && hasNoExpenses && (
  <InlineTip
    tipId="dashboard_first_visit"
    message={t('onboarding.tip.dashboardFirstVisit')}
    onDismiss={dismiss}
  />
)}
```

For TooltipTip, create a `ref` on the anchor element and pass it to the component.

## Success Criteria

- Each tip shows on correct page under correct conditions
- Tips only show when onboarding is complete (useTip handles this)
- Tips only show once (dismissed state persists)
- Dismissing a tip removes it from the page with animation
- CTA on `expenses_no_categories` navigates to categories page
- All tip text is i18n-driven

## Task Tests

- [x] Unit tests: DashboardPage shows InlineTip when user has 0 expenses and tip not dismissed
- [x] Unit tests: DashboardPage does NOT show InlineTip when tip is dismissed
- [x] Unit tests: Expenses page shows InlineTip when no categories exist
- [x] Unit tests: CTA on expenses tip navigates to categories
- [x] Unit tests: TooltipTip components render when conditions met

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/packages/features/src/dashboard/DashboardPage.tsx`
- `src/packages/features/src/expenses/` — Expense list page
- `src/packages/features/src/summary/TripSummaryPage.tsx`
- `src/packages/features/src/budget/` — Budget page
- `src/packages/features/src/members/MembersPage.tsx`
- `src/packages/features/src/categories/CategoriesPage.tsx`
- `src/packages/features/src/onboarding/useTip.ts` (from task 5.0)
- `src/packages/ui/src/molecules/InlineTip/` (from task 4.0)
- `src/packages/ui/src/molecules/TooltipTip/` (from task 4.0)
