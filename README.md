# My Travel Budgets

Full-stack travel budget management app for tracking shared trip expenses. Plan trips, split costs with travel companions, and keep spending under control — all from web or mobile.

Served at **mybudget.cards**

## Screenshots

<p align="center">
  <img src="docs/screenshots/mobile-dashboard.png" alt="Dashboard" width="180"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/mobile-budget.png" alt="Budget Breakdown" width="180"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/mobile-categories.png" alt="Categories" width="180"/>
  &nbsp;&nbsp;
</p>

## Tech Stack

| Layer         | Technology                                 |
| ------------- | ------------------------------------------ |
| Monorepo      | Turborepo + pnpm workspaces                |
| Web           | React 19 + Vite + Tamagui                  |
| Mobile        | Expo (iOS & Android) + Tamagui             |
| Shared UI     | Tamagui (`packages/ui`)                    |
| Shared Logic  | TypeScript + Zod (`packages/core`)         |
| Features      | Shared feature hooks (`packages/features`) |
| API Client    | Typed HTTP client (`packages/api-client`)  |
| API           | NestJS 11                                  |
| Database      | PostgreSQL + Prisma 7                      |
| Auth          | Magic link + PIN login (JWT sessions)      |
| Email         | Resend                                     |
| Image Storage | Cloudinary                                 |
| Hosting (web) | Vercel (`mybudget.cards`)                  |
| Hosting (API) | Render                                     |
| Hosting (DB)  | Neon (managed PostgreSQL)                  |
| Mobile Builds | Expo EAS                                   |
| Language      | TypeScript (strict)                        |

## Project Structure

```
my-travel-budgets/
├── src/
│   ├── apps/
│   │   ├── web/        — React (Vite) + Tamagui, mobile-first responsive
│   │   ├── mobile/     — Expo + Tamagui (iOS & Android)
│   │   └── api/        — NestJS REST API + Prisma ORM
│   └── packages/
│       ├── ui/         — Tamagui shared components (atomic design: quarks → templates)
│       ├── core/       — Shared Zod schemas, types, and constants
│       ├── features/   — Shared feature hooks and logic (travels, expenses, members…)
│       ├── api-client/ — Typed HTTP client for the API
│       ├── eslint-config/       — Shared ESLint configuration
│       └── typescript-config/   — Shared tsconfig presets
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **PostgreSQL** running locally (or via Docker)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/my-travel-budgets.git
cd my-travel-budgets

# Install dependencies
pnpm install

# Configure environment
cp src/apps/api/.env.example src/apps/api/.env
# Edit .env with your database credentials

# Run database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Start all dev servers
pnpm dev
```

The web app runs on `http://localhost:5173` and the API on `http://localhost:3000`.

### Commands

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start all dev servers in parallel |
| `pnpm build`       | Build all apps and packages       |
| `pnpm test`        | Run tests across all workspaces   |
| `pnpm lint`        | Lint all packages                 |
| `pnpm typecheck`   | Type-check all packages           |
| `pnpm db:generate` | Generate Prisma client            |
| `pnpm db:migrate`  | Run database migrations           |

## Features

- **Trip Management** — Create and organize travels with cover photos, dates, and target currency
- **Shared Expenses** — Track who paid what and split costs between trip members
- **Category Budgets** — Set per-category spending limits (food, transport, accommodation, etc.)
- **Dashboard** — Bar chart (spending per person) and progress bars (per-category budget usage)
- **Multi-Currency** — Support for multiple currencies with local symbols
- **Guest Members** — Add travel companions even if they don't have an account
- **Passwordless Auth** — Sign in via magic link or PIN code, no passwords to remember
- **Profile Management** — Update name, avatar, and account settings
- **Export** — Export expense data for external use

## Data Model

```
User ──< Travel ──< Category ──< Expense
              └──< TravelMember ──────┘
```

Each travel has members (registered users or guests), categories with optional budget limits, and expenses tied to both a category and the member who paid.

## License

Private project.
