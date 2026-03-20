# Task 1.0: Shared Travel Auth Infrastructure

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Create the reusable guard, policy, and decorator that all travel-scoped endpoints depend on. These components plug into the existing `CommonAuthModule` and enforce membership-based access control for every travel-scoped route.

<skills>
### Standard Skills Compliance

No specific skills from `.claude/skills` apply to this backend task.
</skills>

<requirements>

- `TravelMemberGuard` must verify the authenticated user is a member of the travel identified by `:travelId` (or `:id`) route param
- On success, the guard attaches the full `TravelMember` record (including `role`) to `request.travelMember`
- On failure (not a member), the guard throws `ForbiddenException` with message `'Not a member of this travel'`
- `IsTravelOwnerPolicy` implements the existing `Policy` interface and returns `true` only when `request.travelMember.role === 'owner'`
- `@CurrentTravelMember()` is a param decorator that extracts `request.travelMember`
- All three components are exported from `CommonAuthModule` / `index.ts`

</requirements>

## Subtasks

- [x] 1.1 Create `travel-member.guard.ts` — implements `CanActivate`, injects `PrismaService`, queries `travelMember.findFirst` by `travelId` + `userId`. See techspec.md § TravelMemberGuard for the full implementation reference.
- [x] 1.2 Create `is-travel-owner.policy.ts` — implements `Policy` interface, reads `request.travelMember.role`. See techspec.md § IsTravelOwnerPolicy.
- [x] 1.3 Create `current-travel-member.decorator.ts` — param decorator using `createParamDecorator` that returns `request.travelMember`.
- [x] 1.4 Export all three from `src/apps/api/src/modules/common/auth/index.ts`.
- [x] 1.5 Write unit tests for `TravelMemberGuard` (member found → attaches + returns true; member not found → throws 403).
- [x] 1.6 Write unit tests for `IsTravelOwnerPolicy` (owner role → true; member role → false; missing travelMember → false).

## Implementation Details

Refer to techspec.md sections:
- **TravelMemberGuard** — full code sample and behavior spec
- **IsTravelOwnerPolicy** — full code sample
- **Data flow** — shows where these fit in the guard chain: `JwtAuthGuard` → `TravelMemberGuard` → `PolicyGuard`

The guard extracts `travelId` from `request.params.travelId ?? request.params.id` to support both `/travels/:id` and `/travels/:travelId/...` route patterns.

## Success Criteria

- `TravelMemberGuard` passes when the JWT user is a member and attaches the record to the request
- `TravelMemberGuard` rejects with 403 when the user is not a member
- `IsTravelOwnerPolicy` correctly distinguishes owner vs member roles
- `@CurrentTravelMember()` returns the attached `TravelMember` from the request
- All components are exported from `CommonAuthModule`
- All unit tests pass

## Task Tests

- [x] Unit tests: `travel-member.guard.spec.ts` — mock `PrismaService` and `ExecutionContext`; test member found, member not found, param extraction (`travelId` vs `id`)
- [x] Unit tests: `is-travel-owner.policy.spec.ts` — mock request with different roles; test owner returns true, member returns false

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/apps/api/src/modules/common/auth/policy.interface.ts` — `Policy` interface to implement
- `src/apps/api/src/modules/common/auth/jwt-session.types.ts` — `JwtAuthUser` type
- `src/apps/api/src/modules/common/auth/current-user.decorator.ts` — existing decorator to follow as pattern
- `src/apps/api/src/modules/common/auth/index.ts` — barrel exports to update
- `src/apps/api/src/modules/common/auth/common-auth.module.ts` — module to extend
- `src/apps/api/src/modules/prisma/prisma.service.ts` — injected dependency
