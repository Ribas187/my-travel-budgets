# Task 2.0: API Onboarding Module

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Create a new `OnboardingModule` in the NestJS API with repository, service, and controller. Implements 3 endpoints for completing onboarding, dismissing tips, and resetting tips. Also update the existing `UserMeDto` to include the new onboarding fields.

<skills>
### Standard Skills Compliance

- `nestjs-best-practices` — Module-per-domain, repository pattern, Symbol-based DI, guard chain
- `clean-ddd-hexagonal` — Repository interface/implementation split, service layer
</skills>

<requirements>
- Create `OnboardingModule` with repository interface + Prisma implementation
- Create `OnboardingService` implementing `IOnboardingService`
- Create `OnboardingController` with 3 PATCH endpoints (all require `JwtAuthGuard`)
- `PATCH /onboarding/complete` — Sets `onboardingCompletedAt` to now (204)
- `PATCH /onboarding/tips/:tipId/dismiss` — Validates tipId against `OnboardingTipId`, adds to `dismissedTips` (204, idempotent)
- `PATCH /onboarding/tips/reset` — Clears `dismissedTips` array (204)
- Update `UserMeDto` to include `onboardingCompletedAt` and `dismissedTips`
- Register `OnboardingModule` in `AppModule`
- Follow existing patterns: Symbol-based DI tokens, domain exceptions for validation errors
</requirements>

## Subtasks

- [x] 2.1 Create `src/apps/api/src/modules/onboarding/` directory structure (dto/, repository/)
- [x] 2.2 Create repository interface `IOnboardingRepository` with methods: `setOnboardingCompleted`, `clearOnboardingCompleted`, `addDismissedTip`, `clearDismissedTips`
- [x] 2.3 Create Prisma repository implementation `PrismaOnboardingRepository`
- [x] 2.4 Create `OnboardingService` with business logic (validate tip IDs, idempotent dismiss)
- [x] 2.5 Create `OnboardingController` with 3 PATCH endpoints using `JwtAuthGuard`
- [x] 2.6 Create DI token `ONBOARDING_REPOSITORY` in a tokens file
- [x] 2.7 Wire up `OnboardingModule` with providers and register in `AppModule`
- [x] 2.8 Update `UserMeDto` in users module to expose `onboardingCompletedAt` and `dismissedTips`
- [x] 2.9 Write unit and integration tests

## Implementation Details

Refer to **techspec.md** sections:
- "Main Interfaces" — `IOnboardingService`, `IOnboardingRepository`
- "API Endpoints" — 3 PATCH endpoints with validation rules
- Follow the same patterns as `src/apps/api/src/modules/users/` for DI, guards, and DTOs

Tip ID validation: import `ONBOARDING_TIP_IDS` from `@repo/core` and check if the param is included. Return `BusinessValidationError` (400) for invalid IDs.

## Success Criteria

- All 3 endpoints return correct status codes
- Invalid tip IDs return 400 Bad Request
- Dismissing the same tip twice is idempotent (no duplicates in array)
- `GET /users/me` now includes `onboardingCompletedAt` and `dismissedTips` in response
- All tests pass

## Task Tests

- [x] Unit tests: `OnboardingService` — completeOnboarding sets timestamp, dismissTip validates and appends, resetTips clears array, dismissTip is idempotent
- [x] Unit tests: `OnboardingService` — dismissTip with invalid ID throws BusinessValidationError
- [x] Integration tests: HTTP tests for all 3 endpoints (success + error cases)
- [x] Integration tests: Verify `GET /users/me` includes new fields after onboarding actions

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/apps/api/src/modules/users/` — Reference pattern for module structure
- `src/apps/api/src/modules/common/auth/jwt-auth.guard.ts` — Guard to use
- `src/apps/api/src/modules/common/auth/current-user.decorator.ts` — Decorator to use
- `src/apps/api/src/modules/common/exceptions/` — Domain exceptions
- `src/apps/api/src/modules/users/dto/user-me.dto.ts` — Needs new fields
- `src/apps/api/src/app.module.ts` — Register new module
