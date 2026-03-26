# Architecture & Monorepo Guidelines

## Monorepo Structure

```
src/
├── apps/
│   ├── web/        → React + Vite + Tamagui (mobile-first responsive)
│   ├── mobile/     → Expo + Tamagui
│   └── api/        → NestJS + Prisma + PostgreSQL
└── packages/
    ├── ui/             → Shared Tamagui components (Atomic Design)
    ├── core/           → Shared types, Zod schemas, constants, i18n
    ├── api-client/     → Typed API client for web & mobile
    ├── features/       → Shared feature containers (cross-platform)
    ├── eslint-config/  → Shared ESLint configuration
    └── typescript-config/ → Shared TypeScript configuration
```

Package names: `@repo/ui`, `@repo/core`, `@repo/api-client`, `@repo/eslint-config`, `@repo/typescript-config`

## Package Boundaries

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
| Reusable UI component                | `packages/ui/src/{level}/`             |
| API endpoint type / client method    | `packages/api-client/src/`             |
| NestJS module / controller / service | `apps/api/src/modules/{domain}/`       |
| Repository interface + impl          | `apps/api/src/modules/{domain}/repository/` |
| Shared feature container (page, form) | `packages/features/src/{domain}/`     |
| Web-only feature (e.g. profile)      | `apps/web/src/features/{domain}/`      |
| Shared React Query hook              | `packages/api-client/src/hooks/{domain}/` |
| Mobile-only screen                   | `apps/mobile/`                         |
| Translation strings                  | `packages/core/src/i18n/{locale}.json` |
| Shared guards / decorators / filters | `apps/api/src/modules/common/`         |

## UI — Atomic Design (`packages/ui`)

Components follow the Atomic Design hierarchy with barrel exports at each level:

```
packages/ui/src/
├── quarks/       → Design tokens, theme config, color utilities
├── atoms/        → Base components (Typography, Button, FAB, Avatar, etc.)
├── molecules/    → Combinations of atoms (AmountInput, ExpenseRow, StatCard, etc.)
├── organisms/    → Complex feature components (AppShell, Sidebar, BottomNav, etc.)
└── index.ts      → Main barrel re-exporting all levels
```

- Each component lives in its own directory: `ComponentName/ComponentName.tsx` + `index.ts`
- Each level has a barrel `index.ts` exporting all its components
- New components go at the appropriate level based on complexity

## NestJS Backend Patterns

### Module Structure

One module per domain: `auth`, `users`, `travels`, `members`, `categories`, `expenses`, `dashboard`, `cloudinary`

Each module follows this layout:

```
modules/{domain}/
├── dto/                              → Data Transfer Objects (class-validator)
├── repository/
│   ├── {domain}.repository.interface.ts  → Abstract contract
│   └── {domain}.repository.prisma.ts     → Prisma implementation
├── {domain}.controller.ts            → HTTP layer
├── {domain}.service.ts               → Business logic (depends on repository interface)
└── {domain}.module.ts                → Wires DI: binds interface token to implementation
```

### Repository Pattern

- Define an interface per domain (e.g., `ITravelRepository`)
- Implement with Prisma (e.g., `TravelPrismaRepository`)
- Register via Symbol-based DI tokens in `modules/common/database/repository.tokens.ts`
- Services inject the interface token, never the concrete class

### Guards & Authorization

Three-layer guard chain applied to protected endpoints:

1. **JwtAuthGuard** — authenticates the JWT bearer token (Passport)
2. **TravelMemberGuard** — verifies the user is a member of the travel (attaches `request.travelMember`)
3. **PolicyGuard** — evaluates domain-specific policies via `@CheckPolicy(PolicyClass)` decorator

Custom decorators: `@CurrentUser()`, `@CurrentTravelMember()`, `@CheckPolicy()`

### Cross-cutting Concerns (`modules/common/`)

| Directory       | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `auth/`         | Guards, decorators, JWT strategy, policy interface |
| `database/`     | Repository DI tokens (Symbols)                    |
| `exceptions/`   | Domain exception hierarchy (`DomainException` base, `EntityNotFoundError`, `ConflictError`, `ForbiddenError`, `BusinessValidationError`, `UnauthorizedError`) |
| `filters/`      | `AllExceptionsFilter` — maps domain exceptions to HTTP responses |
| `interceptors/` | `DecimalSerializationInterceptor` — Prisma Decimal → number |
| `email/`        | Email service                                     |
| `types/`        | Pagination and shared types                       |

## Frontend Patterns (Web)

### Feature-based Organization

```
apps/web/src/
├── features/{domain}/    → Page components, forms, dialogs per domain
├── hooks/                → React Query mutations & queries (one hook per operation)
├── contexts/             → React Context for shared UI state (TravelContext)
├── providers/            → Context providers (AuthProvider)
├── routes/               → TanStack Router file-based routing
├── lib/                  → Utilities (toast, etc.)
└── utils/                → Pure helper functions
```

- **Server state:** React Query (TanStack Query) with `queryKeys` from `@repo/api-client`
- **Client state:** React Context (`TravelContext`, `AuthProvider`)
- **Routing:** TanStack Router with file-based routes; protected routes under `_authenticated/`
- Mobile-first responsive design on web
- Use Tamagui components from `@repo/ui` — avoid raw HTML/RN primitives for styled elements
- All user-facing text via i18n translation keys, never hardcoded
- Date/number formatting must respect the user's locale (`Intl.DateTimeFormat`, `Intl.NumberFormat`)
- Currency display uses the travel's ISO 4217 currency code + user locale
