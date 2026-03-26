# Code Conventions

## TypeScript

- Strict mode enabled everywhere — no `any` unless truly unavoidable
- Shared base `tsconfig.base.json` at repo root; each app/package extends it
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use Zod `.infer<>` to derive types from schemas — don't duplicate type definitions manually

## Naming

| Thing                    | Convention             | Example                              |
| ------------------------ | ---------------------- | ------------------------------------ |
| Files (components)       | PascalCase in own dir  | `Typography/Typography.tsx`          |
| Files (utilities)        | camelCase              | `formatCurrency.ts`                  |
| Files (NestJS)           | kebab-case with suffix | `travels.controller.ts`              |
| Files (repository iface) | kebab-case with suffix | `travels.repository.interface.ts`   |
| Files (repository impl)  | kebab-case with suffix | `travels.repository.prisma.ts`      |
| React components         | PascalCase             | `ExpenseList`                        |
| Functions / variables    | camelCase              | `getTravelById`                      |
| Constants                | UPPER_SNAKE_CASE       | `MAX_BUDGET_LIMIT`                   |
| DI tokens (Symbols)     | UPPER_SNAKE_CASE       | `TRAVEL_REPOSITORY`                  |
| Database fields          | camelCase              | Prisma default                       |
| API routes               | kebab-case             | `/travels/:id/magic-link`            |
| Translation keys         | dot.notation           | `travel.create.title`                |

## Imports

- Use path aliases configured in tsconfig (e.g., `@/` for src root within each app)
- Import from package name, not relative paths across package boundaries (e.g., `import { Button } from '@repo/ui'`)

## Error Handling

- Backend: throw domain exceptions (`EntityNotFoundError`, `ConflictError`, etc.) from services; `AllExceptionsFilter` maps them to HTTP responses
- Frontend: handle errors at the query/mutation level, show user-friendly messages via i18n keys
- Never swallow errors silently
