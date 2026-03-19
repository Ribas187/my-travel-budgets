# My Travel Budgets

Full-stack travel budget management app (web + mobile) served at `mybudget.cards`.

## Tech Stack

Turborepo monorepo · React/Vite (web) · Expo (mobile) · Tamagui (shared UI) · NestJS (API) · Prisma · PostgreSQL

## Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages
pnpm dev              # Start dev servers
pnpm test             # Run tests across all packages
pnpm lint             # Lint all packages
pnpm typecheck        # Type-check all packages
```

## Key Specs

- [Design Spec](docs/specs/travel-budgets-design.md) — data model, API, screens, auth rules
- [i18n Spec](docs/specs/i18n-design.md) — translation system, locale handling
- [Implementation Plans](docs/plans.md) — ordered build phases

## Guidelines

- [Architecture & Monorepo](.claude/architecture.md)
- [Code Conventions](.claude/code-conventions.md)
- [Testing](.claude/testing.md)
