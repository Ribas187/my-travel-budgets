# Task 1.0: Prisma Migration + Shared Types & Constants

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Add onboarding fields to the Prisma User model and create all shared types, constants, and i18n keys in `@repo/core`. This is the foundation task — everything else depends on it.

<skills>
### Standard Skills Compliance

- `clean-ddd-hexagonal` — Domain type definitions
- `nestjs-best-practices` — Prisma schema conventions
</skills>

<requirements>
- Add `onboardingCompletedAt DateTime?` to User model in Prisma schema
- Add `dismissedTips String[] @default([])` to User model in Prisma schema
- Generate and apply Prisma migration
- Create `OnboardingTipId` union type in `@repo/core`
- Create `ONBOARDING_TIP_IDS` constant array in `@repo/core`
- Create `DefaultCategory` interface and `DEFAULT_CATEGORIES` constant in `@repo/core`
- Add all onboarding i18n keys to `en.json` and `pt-BR.json`
- Export new types and constants from `@repo/core` barrel
</requirements>

## Subtasks

- [x] 1.1 Add `onboardingCompletedAt` and `dismissedTips` fields to the `User` model in `src/apps/api/prisma/schema.prisma`
- [x] 1.2 Run `npx prisma migrate dev --name add-onboarding-fields` to generate and apply migration
- [x] 1.3 Create `src/packages/core/src/types/onboarding.ts` with `OnboardingTipId` type and `ONBOARDING_TIP_IDS` array
- [x] 1.4 Create `src/packages/core/src/constants/default-categories.ts` with `DefaultCategory` interface and `DEFAULT_CATEGORIES` constant
- [x] 1.5 Add all `onboarding.*` i18n keys to `src/packages/core/src/i18n/en.json` (see design spec for full key list)
- [x] 1.6 Add all `onboarding.*` i18n keys to `src/packages/core/src/i18n/pt-BR.json` (Portuguese translations)
- [x] 1.7 Export new types and constants from `@repo/core` barrel exports
- [x] 1.8 Run `pnpm typecheck` to verify no type errors

## Implementation Details

Refer to **techspec.md** sections:
- "Data Models" — Prisma schema extension, shared types
- "Relevant and dependent files" — Backend and shared packages sections

The i18n keys are listed in the design spec at `docs/superpowers/specs/2026-03-27-onboarding-flow-design.md` under "i18n Keys". Default categories are defined under "Default Categories". Category names should use i18n keys (`onboarding.defaultCategory.food`, etc.).

## Success Criteria

- Prisma migration applies cleanly with no errors
- `OnboardingTipId` type includes all 6 tip IDs from the PRD
- `DEFAULT_CATEGORIES` has 6 entries with `nameKey`, `icon`, and `color`
- All i18n keys from the design spec exist in both `en.json` and `pt-BR.json`
- `pnpm typecheck` passes

## Task Tests

- [x] Unit tests: Verify `ONBOARDING_TIP_IDS` array matches `OnboardingTipId` type (all IDs present)
- [x] Unit tests: Verify `DEFAULT_CATEGORIES` has 6 entries with required fields
- [x] Integration tests: Prisma Client can read/write `onboardingCompletedAt` and `dismissedTips` fields

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/apps/api/prisma/schema.prisma`
- `src/packages/core/src/types/`
- `src/packages/core/src/constants/`
- `src/packages/core/src/i18n/en.json`
- `src/packages/core/src/i18n/pt-BR.json`
- `src/packages/core/src/index.ts` (barrel export)
- `docs/superpowers/specs/2026-03-27-onboarding-flow-design.md` (i18n key reference)
