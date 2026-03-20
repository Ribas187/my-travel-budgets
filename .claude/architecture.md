# Architecture & Monorepo Guidelines

## Monorepo Structure

```
apps/web/        → React + Vite + Tamagui (mobile-first responsive)
apps/mobile/     → Expo + Tamagui
apps/api/        → NestJS + Prisma + PostgreSQL
packages/ui/     → Shared Tamagui components
packages/core/   → Shared types, Zod schemas, constants, i18n
packages/api-client/ → Typed API client for web & mobile
```

## Rules

### Package Boundaries

- Zod schemas in `packages/core` are the **single source of truth** for validation — reuse them in both frontend and backend
- Shared UI components go in `packages/ui`, not duplicated across apps
- API types and the typed client live in `packages/api-client` — apps never define API types locally
- i18n translations live in `packages/core/src/i18n/` — no hardcoded user-facing strings in components

### Dependency Direction

- `apps/*` → `packages/*` (apps depend on packages)
- `packages/ui` → `packages/core` (UI may use shared types/schemas)
- `packages/api-client` → `packages/core` (client uses shared types)
- Packages must **never** depend on apps
- `packages/core` must have **zero** dependencies on other internal packages

### New Code Placement

| What                                 | Where                                  |
| ------------------------------------ | -------------------------------------- |
| Zod schema / shared type             | `packages/core/src/`                   |
| Reusable UI component                | `packages/ui/src/`                     |
| API endpoint type / client method    | `packages/api-client/src/`             |
| NestJS module / controller / service | `apps/api/src/`                        |
| Web-only screen or page              | `apps/web/src/`                        |
| Mobile-only screen                   | `apps/mobile/src/`                     |
| Translation strings                  | `packages/core/src/i18n/{locale}.json` |

### NestJS Backend Patterns

- One module per domain: `auth`, `users`, `travels`, `members`, `categories`, `expenses`, `dashboard`
- Controllers handle HTTP, services handle business logic, keep them separated
- Use Prisma for all database access — no raw SQL unless strictly necessary
- All travel-scoped endpoints must verify membership via a guard before granting access

### Frontend Patterns

- Mobile-first responsive design on web
- Use Tamagui components from `packages/ui` — avoid raw HTML/RN primitives for styled elements
- All user-facing text via i18n translation keys, never hardcoded
- Date/number formatting must respect the user's locale (`Intl.DateTimeFormat`, `Intl.NumberFormat`)
- Currency display uses the travel's ISO 4217 currency code + user locale
