# My Travel Budgets — Design Spec

## Overview

A full-stack travel budget management application where users can create trips, track expenses by category, share budgets with other users or guests, and visualize spending through a dashboard. Served at `mybudget.cards`.

## Goals

- Users can sign up via magic link and manage multiple travels
- Each travel has a base currency, overall budget, and per-category budget limits
- Travel owners can invite registered users (by email) or add named guests
- All members see who spent what; budget exceeded warnings are surfaced visually
- Dashboard provides bar chart (spending per person) and progress bars (per-category budget usage)
- Web app is mobile-first responsive; mobile app via Expo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo |
| Web | React + Vite + Tamagui |
| Mobile | Expo + Tamagui |
| Shared UI | Tamagui (`packages/ui`) |
| Shared Logic | TypeScript, Zod (`packages/core`) |
| API Client | Typed client (`packages/api-client`) |
| Backend | NestJS |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | Magic link (JWT sessions) |
| Email | Resend |
| Image Storage | Cloudinary |
| Hosting (web) | Vercel (`mybudget.cards`) |
| Hosting (API) | Railway (`api.mybudget.cards`) |
| Hosting (DB) | Railway (managed PostgreSQL) |
| Mobile Builds | Expo EAS |

## Monorepo Structure

```
my-travel-budgets/
├── apps/
│   ├── web/            — React (Vite) + Tamagui, mobile-first responsive
│   ├── mobile/         — Expo + Tamagui
│   └── api/            — NestJS + Prisma + PostgreSQL
├── packages/
│   ├── ui/             — Shared Tamagui components (buttons, cards, forms, charts)
│   ├── core/           — Shared types, Zod schemas, constants, currency config
│   └── api-client/     — Typed API client shared by web and mobile
├── turbo.json
├── package.json
└── tsconfig.base.json
```

- Turborepo orchestrates builds, lint, and test across all packages
- TypeScript everywhere with a shared base tsconfig
- Zod schemas in `packages/core` are the single source of truth for validation on both frontend and backend

## Data Model

### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| email | string | unique |
| name | string | |
| avatarUrl | string? | nullable |
| createdAt | datetime | |
| updatedAt | datetime | |

### Travel
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | string | |
| description | string? | nullable |
| imageUrl | string? | nullable, cover photo |
| currency | string | ISO 4217 code (e.g. "USD", "BRL", "EUR") |
| budget | decimal | total budget limit |
| startDate | date | |
| endDate | date | |
| createdById | UUID | FK → User |
| createdAt | datetime | |
| updatedAt | datetime | |

### TravelMember
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| travelId | UUID | FK → Travel |
| userId | UUID? | FK → User, nullable |
| guestName | string? | nullable |
| role | enum | "owner" or "member" |
| createdAt | datetime | |

Either `userId` or `guestName` is set, never both. The travel creator is automatically added as an owner.

### Category
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| travelId | UUID | FK → Travel |
| name | string | e.g. "Food", "Transport", "Accommodation" |
| budgetLimit | decimal? | nullable, per-category cap |
| icon | string | icon identifier |
| color | string | hex color |
| createdAt | datetime | |

### Expense
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| travelId | UUID | FK → Travel |
| categoryId | UUID | FK → Category |
| memberId | UUID | FK → TravelMember |
| amount | decimal | |
| description | string | |
| date | date | |
| createdAt | datetime | |
| updatedAt | datetime | |

### MagicLink
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| email | string | |
| token | string | unique |
| expiresAt | datetime | |
| usedAt | datetime? | nullable |

## API Design

Base URL: `api.mybudget.cards`

Auth via JWT in `Authorization: Bearer <token>` header. All travel endpoints verify membership before granting access.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/magic-link` | Send magic link to email |
| GET | `/auth/verify?token=` | Verify token, return JWT |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update name, avatar |

### Travels
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/travels` | Create travel |
| GET | `/travels` | List user's travels |
| GET | `/travels/:id` | Travel detail with members & summary |
| PATCH | `/travels/:id` | Update travel (name, image, budget, dates) |
| DELETE | `/travels/:id` | Delete travel (owner only) |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/travels/:id/members` | Add member (by email or guest name) |
| DELETE | `/travels/:id/members/:memberId` | Remove member (owner only) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/travels/:id/categories` | Create category |
| PATCH | `/travels/:id/categories/:catId` | Update category |
| DELETE | `/travels/:id/categories/:catId` | Delete category |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/travels/:id/expenses` | Add expense |
| GET | `/travels/:id/expenses` | List expenses (filterable by category, member, date) |
| PATCH | `/travels/:id/expenses/:expId` | Edit expense |
| DELETE | `/travels/:id/expenses/:expId` | Delete expense |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/travels/:id/dashboard` | Aggregated data: spending per person, spending per category with budget limits, total spent vs total budget |

## Screens & Navigation

### Auth Flow
- **Landing / Login** — enter email, request magic link
- **Check Your Email** — confirmation screen

### Main (after login)
- **My Travels** — list of travel cards (image, name, dates, currency, budget progress bar)
- **Create/Edit Travel** — form: name, image upload, description, currency selector, budget, dates

### Inside a Travel
- **Dashboard** — bar chart (spending per person), progress bars (per-category budget usage, red when exceeded)
- **Expenses** — list view with filters (category, member, date). Add/edit via modal or bottom sheet
- **Categories** — list with icons and colors, budget limits shown. Add/edit category
- **Members** — list of all members (registered + guests), invite form (email or guest name), owner can remove

### Profile
- Name, avatar, email (read-only), logout

### Navigation Patterns
- **Web (small screens):** bottom navigation bar inside a travel (Dashboard, Expenses, Categories, Members), hamburger or drawer for travel list and profile
- **Web (large screens):** sidebar with travel list, top tabs inside a travel
- **Mobile:** bottom tab bar inside a travel, stack navigation for travel list and profile

## Budget Alerts

Budget exceeded status is derived at query time (not stored):
- **Overall:** sum of all expenses vs `Travel.budget`
- **Per-category:** sum of category expenses vs `Category.budgetLimit`

Visual indicators:
- Progress bars turn red and show a warning icon when >= 100%
- Amber/yellow when >= 80% as an early warning

## Authorization Rules

| Action | Who Can Do It |
|--------|--------------|
| Create travel | Any authenticated user |
| View travel data | Any travel member |
| Add/edit/delete expenses | Any travel member (own expenses) |
| Add/edit/delete categories | Travel owner |
| Add/remove members | Travel owner |
| Edit/delete travel | Travel owner |

## Infrastructure

- **Domain:** `mybudget.cards` (web), `api.mybudget.cards` (API)
- **Web hosting:** Vercel — deploy from `apps/web`, mobile-first responsive
- **API hosting:** Railway — deploy from `apps/api`, auto-deploy on push
- **Database:** Railway managed PostgreSQL
- **Email:** Resend for magic link delivery
- **Image storage:** Cloudinary for travel cover photos and user avatars
- **Mobile:** Expo EAS for builds and OTA updates
