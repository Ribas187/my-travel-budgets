# Task 3.0: Members Module

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Create the `MembersModule` to manage travel participants. The owner can add members by email (registered users) or by guest name, and can remove members. Duplicate detection, guest fallback messaging, and expense preservation on removal are key behaviors.

<skills>
### Standard Skills Compliance

No specific skills from `.claude/skills` apply to this backend task.
</skills>

<requirements>

- PRD M-1: `POST /travels/:travelId/members` accepts either `{ email }` or `{ guestName }`, not both. Owner only.
- PRD M-2: When `email` matches a registered user → create `TravelMember` with `userId` and role `member`
- PRD M-3: When `email` does not match → return `404` with guest fallback suggestion message
- PRD M-4: When `guestName` provided → create `TravelMember` with `guestName`, `userId: null`, role `member`
- PRD M-5: Duplicate member additions return `409 Conflict`
- PRD M-6: `DELETE /travels/:travelId/members/:memberId` — owner only. Owner cannot remove themselves.
- PRD M-7: Removing a member preserves their expenses (soft reference)

</requirements>

## Subtasks

- [x] 3.1 Create `add-member.dto.ts` with `email?` and `guestName?` fields, plus custom validation ensuring exactly one is provided.
- [x] 3.2 Create `members.service.ts` with methods: `addMember`, `removeMember`. See techspec.md § Service Interfaces and § Add/Remove member logic.
- [x] 3.3 Create `members.controller.ts` with `POST` and `DELETE` routes. Both are owner-only (full guard chain: `JwtAuthGuard` + `TravelMemberGuard` + `PolicyGuard` + `IsTravelOwnerPolicy`).
- [x] 3.4 Create `members.module.ts` — imports `PrismaModule`, `CommonAuthModule`.
- [x] 3.5 Register `MembersModule` in `app.module.ts`.
- [x] 3.6 Write unit tests for `MembersService` — mock PrismaService, test: email lookup found, email not found (404), guest creation, duplicate detection (409 via P2002), owner self-removal prevention (400).
- [x] 3.7 Write unit tests for `MembersController`.
- [x] 3.8 Write integration tests `members.integration.spec.ts` — real DB: add by email, add guest, duplicate handling, remove member, verify expenses preserved after removal.

## Implementation Details

Refer to techspec.md sections:
- **API Endpoints § Members** — route table with guard chains
- **Service Interfaces** — `MembersService` method signatures
- **Request DTOs** — `AddMemberDto` validation
- **Add member logic** — step-by-step flow (email lookup → user not found 404 → duplicate 409 → guest creation)
- **Remove member logic** — owner self-removal prevention, expenses preserved

Key details:
- Catch Prisma error code `P2002` (unique constraint violation) on `@@unique([travelId, userId])` to return 409
- The `404` response for unregistered email should include a message suggesting the guest flow
- `removeMember` deletes the `TravelMember` record but does NOT cascade to expenses (Prisma schema has no `onDelete: Cascade` on `Expense.memberId`)

## Success Criteria

- Adding a member by email with a registered user creates the membership correctly
- Adding by email with an unregistered email returns 404 with suggestion message
- Adding a guest creates a member with `userId: null`
- Duplicate additions return 409
- Owner cannot remove themselves (400)
- Removing a member preserves their expenses
- Only the travel owner can add/remove members (403 for non-owners)
- All unit and integration tests pass

## Task Tests

- [x] Unit tests: `members.service.spec.ts`
- [x] Unit tests: `members.controller.spec.ts`
- [x] Integration tests: `members.integration.spec.ts` (real DB)

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/apps/api/src/app.module.ts` — register new module
- `src/apps/api/src/modules/common/auth/` — guards, policies, decorators
- `src/apps/api/src/modules/prisma/prisma.service.ts` — database access
- `src/apps/api/prisma/schema.prisma` — `TravelMember` model, `@@unique([travelId, userId])`
- `src/apps/api/src/modules/users/users.service.ts` — pattern reference for user lookup
