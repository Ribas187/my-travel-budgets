# Testing Guidelines

## Strategy

- **Backend (NestJS):** integration tests against a real test database, unit tests for pure business logic
- **Frontend (React/Expo):** component tests with Testing Library, unit tests for utilities
- **Shared packages:** unit tests for schemas, helpers, and API client methods

## Rules

- Tests live next to the code they test (co-located `__tests__/` or `.test.ts` / `.spec.ts`)
- Use factories or fixtures for test data — don't hardcode UUIDs or magic values inline
- Backend tests should use a dedicated test database, not mocks for Prisma
- Frontend tests should mock API calls (via MSW or similar), not the database
- Every Zod schema in `packages/core` should have validation tests for both valid and invalid inputs
