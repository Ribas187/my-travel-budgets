# Task 7.0: Wizard Container & Web Routing

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Create the `OnboardingWizard` container in `@repo/features` that orchestrates the 4-step wizard flow, managing step state, API calls, and navigation. Set up the web route and update the `_authenticated` layout to redirect new users to the wizard.

<skills>
### Standard Skills Compliance

- `react` — Hooks, state management, proper cleanup
- `tamagui` — Layout components
</skills>

<requirements>
- `OnboardingWizard` container manages step state (1-4) via `useState`
- Step 1: Optionally saves user name via `PATCH /users/me`, then advances
- Step 2: Creates trip via `POST /travels`, passes trip ID to step 3
- Step 3: Creates categories sequentially via `POST /travels/:id/categories`, advances
- Step 4: Calls `PATCH /onboarding/complete`, navigates to chosen destination
- Skip at any step: calls `PATCH /onboarding/complete`, redirects to `/travels`
- New route: `src/apps/web/src/routes/_authenticated/onboarding.tsx`
- Update `_authenticated.tsx`: migrate to `beforeLoad` with onboarding redirect
- Wizard does NOT use URL-based sub-routes — internal state only
</requirements>

## Subtasks

- [x] 7.1 Create `src/packages/features/src/onboarding/OnboardingWizard.tsx` — container managing steps 1-4
- [x] 7.2 Implement step 1 logic: check if user has name, call `useUpdateUser` if needed, advance to step 2
- [x] 7.3 Implement step 2 logic: use `useCreateTravel` mutation, store created trip ID in local state, advance to step 3
- [x] 7.4 Implement step 3 logic: iterate selected categories, call `useCreateCategory` for each sequentially, advance to step 4
- [x] 7.5 Implement step 4 logic: call `useCompleteOnboarding`, provide 3 navigation options
- [x] 7.6 Implement skip logic: `useCompleteOnboarding` + navigate to `/travels`
- [x] 7.7 Create web route `src/apps/web/src/routes/_authenticated/onboarding.tsx` rendering `OnboardingWizard`
- [x] 7.8 Update `src/apps/web/src/routes/_authenticated.tsx` — add `beforeLoad` with onboarding redirect logic
- [x] 7.9 Export `OnboardingWizard` from `@repo/features` barrel
- [x] 7.10 Write tests

## Implementation Details

Refer to **techspec.md** sections:
- "Routing Design" — `beforeLoad` implementation with redirect
- "Wizard State Management" — Step transitions, local state, skip behavior

The `_authenticated` route must be updated to use `beforeLoad` instead of the current component-level auth check. The `beforeLoad` function should:
1. Check `isAuthenticated` — redirect to `/login` if not
2. Fetch/read user from cache
3. Check `onboardingCompletedAt` — redirect to `/onboarding` if null (unless already on `/onboarding`)

For the wizard container, use existing mutation hooks from `@repo/api-client` (`useUpdateUser`, `useCreateTravel`, `useCreateCategory`, `useCompleteOnboarding`).

## Success Criteria

- New users are redirected to `/onboarding` after login
- Wizard progresses through all 4 steps with correct API calls
- Skip works at any step and marks onboarding complete
- After completion, user is NOT redirected to wizard anymore
- Trip and categories are created correctly via existing APIs
- Route renders without flash of protected content

## Task Tests

- [x] Unit tests: OnboardingWizard renders step 1 initially
- [x] Unit tests: Advancing from step 1 to step 2 works
- [x] Unit tests: Skip at any step calls complete onboarding and navigates
- [x] Unit tests: Step 2 calls createTravel and stores trip ID
- [x] Unit tests: Step 4 calls completeOnboarding
- [x] Integration tests: Verify `_authenticated` beforeLoad redirects when onboarding not complete

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/apps/web/src/routes/_authenticated.tsx` — Update with beforeLoad
- `src/apps/web/src/routes/_authenticated/` — Add onboarding.tsx
- `src/packages/features/src/onboarding/` — OnboardingWizard + barrel
- `src/packages/api-client/src/hooks/` — Existing mutation hooks
- `src/apps/web/src/providers/AuthProvider.tsx` — Auth context for beforeLoad
