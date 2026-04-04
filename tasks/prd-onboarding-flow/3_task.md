# Task 3.0: API Client Extension

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Extend `@repo/api-client` to support the new onboarding API endpoints. Update the `UserMe` type with onboarding fields, add onboarding methods to the `ApiClient` class, create React Query hooks, and add query keys.

<skills>
### Standard Skills Compliance

- `react` — Hooks-based API, proper types
</skills>

<requirements>
- Extend `UserMe` interface with `onboardingCompletedAt: string | null` and `dismissedTips: string[]`
- Add `onboarding` namespace to `ApiClient` with 3 methods: `complete()`, `dismissTip(tipId)`, `resetTips()`
- Create React Query mutation hooks: `useCompleteOnboarding`, `useDismissTip`, `useResetTips`
- All mutations should invalidate `queryKeys.users.me` on success
- `useDismissTip` should use optimistic updates on the user cache
- Export all new hooks from the package barrel
</requirements>

## Subtasks

- [x] 3.1 Update `UserMe` interface in `src/packages/api-client/src/types/index.ts` with `onboardingCompletedAt` and `dismissedTips`
- [x] 3.2 Add `onboarding` namespace to `ApiClient` in `src/packages/api-client/src/client.ts` with `complete()`, `dismissTip(tipId: string)`, `resetTips()`
- [x] 3.3 Create `src/packages/api-client/src/hooks/onboarding/useCompleteOnboarding.ts` — mutation hook, invalidates `users.me`
- [x] 3.4 Create `src/packages/api-client/src/hooks/onboarding/useDismissTip.ts` — mutation with optimistic update on `users.me` cache
- [x] 3.5 Create `src/packages/api-client/src/hooks/onboarding/useResetTips.ts` — mutation hook, invalidates `users.me`
- [x] 3.6 Create barrel export `src/packages/api-client/src/hooks/onboarding/index.ts`
- [x] 3.7 Export new hooks from main package barrel
- [x] 3.8 Run `pnpm typecheck` to verify types

## Implementation Details

Refer to **techspec.md** sections:
- "API Endpoints" — endpoint paths and methods
- "Integration Points" — query cache invalidation strategy

Follow existing hook patterns in `src/packages/api-client/src/hooks/users/`. For optimistic updates in `useDismissTip`, use `queryClient.setQueryData` to append the tip ID to `dismissedTips` before the mutation completes.

## Success Criteria

- `UserMe` type includes new fields
- `ApiClient.onboarding` has all 3 methods calling correct endpoints
- All hooks properly invalidate `queryKeys.users.me`
- `useDismissTip` optimistically updates the cache
- `pnpm typecheck` passes

## Task Tests

- [x] Unit tests: Verify `ApiClient.onboarding.complete()` calls `PATCH /onboarding/complete`
- [x] Unit tests: Verify `ApiClient.onboarding.dismissTip(tipId)` calls correct endpoint
- [x] Unit tests: Verify `ApiClient.onboarding.resetTips()` calls correct endpoint

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/packages/api-client/src/types/index.ts`
- `src/packages/api-client/src/client.ts`
- `src/packages/api-client/src/queryKeys.ts`
- `src/packages/api-client/src/hooks/users/` — Reference pattern
- `src/packages/api-client/src/index.ts` — Barrel export
