# Task 5.0: useTip Hook

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Create the `useTip` hook in `@repo/features` that encapsulates the logic for showing and dismissing contextual tips. It reads `dismissedTips` from the `useUserMe()` cache and provides a simple `{ shouldShow, dismiss }` API.

<skills>
### Standard Skills Compliance

- `react` — Custom hooks, proper cleanup, no unnecessary effects
</skills>

<requirements>
- `useTip(tipId: OnboardingTipId)` returns `{ shouldShow: boolean, dismiss: () => void }`
- `shouldShow` is `true` when the tipId is NOT in `user.dismissedTips` and onboarding IS completed
- `dismiss()` calls `useDismissTip` mutation (from task 3.0) with optimistic update
- Hook reads user data from `useUserMe()` — no additional API calls
- Tips should NOT show during onboarding wizard (only after completion)
- Export from `@repo/features` barrel
</requirements>

## Subtasks

- [x] 5.1 Create `src/packages/features/src/onboarding/useTip.ts` with the hook logic
- [x] 5.2 Handle edge cases: user data loading (shouldShow = false), user not authenticated (shouldShow = false)
- [x] 5.3 Ensure tips don't show when `onboardingCompletedAt` is null
- [x] 5.4 Create barrel export `src/packages/features/src/onboarding/index.ts`
- [x] 5.5 Export from `@repo/features` main barrel
- [x] 5.6 Write hook tests

## Implementation Details

Refer to **techspec.md** sections:
- "Tip Hook (Frontend)" — interface definition
- "Integration Points" — optimistic update strategy

The hook should derive `shouldShow` from the user query data — no local state needed. `dismiss()` should call the mutation hook's `mutate()` function.

## Success Criteria

- `shouldShow` returns `true` for non-dismissed tips when onboarding is complete
- `shouldShow` returns `false` for dismissed tips
- `shouldShow` returns `false` when onboarding is not complete
- `dismiss()` triggers the API call and optimistically updates the cache
- No unnecessary re-renders

## Task Tests

- [x] Unit tests: `shouldShow` is `true` for a tip not in `dismissedTips` (onboarding complete)
- [x] Unit tests: `shouldShow` is `false` for a tip already in `dismissedTips`
- [x] Unit tests: `shouldShow` is `false` when `onboardingCompletedAt` is null
- [x] Unit tests: `shouldShow` is `false` while user data is loading
- [x] Unit tests: `dismiss()` calls the dismiss mutation

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/packages/api-client/src/hooks/users/useUserMe.ts` — User data source
- `src/packages/api-client/src/hooks/onboarding/useDismissTip.ts` — Mutation hook (from task 3.0)
- `src/packages/features/src/index.ts` — Barrel export
