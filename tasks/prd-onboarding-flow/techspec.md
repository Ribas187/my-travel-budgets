# Technical Specification — Onboarding Flow

## Executive Summary

This spec describes the technical design for a hybrid onboarding system: a 4-step welcome wizard and a contextual tips framework. The backend adds a new `onboarding` NestJS module with three endpoints and extends the Prisma `User` model with two fields (`onboardingCompletedAt`, `dismissedTips`). The frontend introduces a new `onboarding/` domain in `@repo/features` with wizard step containers and a `useTip` hook, plus reusable `InlineTip` and `TooltipTip` components in `@repo/ui`. The wizard integrates into the existing `_authenticated` layout route via TanStack Router's `beforeLoad` redirect. All text is i18n-driven; shared constants and types live in `@repo/core`.

## System Architecture

### Component Overview

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Database** | Prisma `User` model extension | Stores `onboardingCompletedAt` (DateTime?) and `dismissedTips` (String[]) |
| **API** | `OnboardingModule` (NestJS) | Three endpoints: complete wizard, dismiss tip, reset tips |
| **Shared** | `@repo/core` additions | `OnboardingTipId` union type, `DEFAULT_CATEGORIES` constant, i18n keys |
| **API Client** | `@repo/api-client` additions | New API methods + React Query hooks for onboarding state mutations |
| **UI** | `@repo/ui` components | `InlineTip`, `TooltipTip` (reusable, cross-platform) |
| **Features** | `@repo/features/onboarding` | Wizard page container (4 steps), `useTip` hook, step components |
| **Web** | Route + layout update | `/onboarding` route, `beforeLoad` redirect in `_authenticated` |

### Data Flow

1. **Login** -> `_authenticated` `beforeLoad` fetches user -> checks `onboardingCompletedAt`
2. **Null** -> redirect to `/onboarding` -> wizard steps call existing APIs (create travel, create categories)
3. **Complete/Skip** -> `PATCH /onboarding/complete` sets timestamp -> redirect to `/travels`
4. **Tip shown** -> `useTip(tipId)` reads `dismissedTips` from user query cache -> renders or hides
5. **Tip dismissed** -> `PATCH /onboarding/tips/:tipId/dismiss` -> optimistic cache update

## Implementation Design

### Main Interfaces

**Onboarding Service (API):**

```typescript
interface IOnboardingService {
  completeOnboarding(userId: string): Promise<void>;
  dismissTip(userId: string, tipId: OnboardingTipId): Promise<void>;
  resetTips(userId: string): Promise<void>;
}
```

**Onboarding Repository (API):**

```typescript
interface IOnboardingRepository {
  setOnboardingCompleted(userId: string): Promise<User>;
  clearOnboardingCompleted(userId: string): Promise<User>;
  addDismissedTip(userId: string, tipId: string): Promise<User>;
  clearDismissedTips(userId: string): Promise<User>;
}
```

**Tip Hook (Frontend):**

```typescript
function useTip(tipId: OnboardingTipId): {
  shouldShow: boolean;
  dismiss: () => void;
};
```

### Data Models

**Prisma Schema Extension (User model):**

```prisma
model User {
  // ... existing fields
  onboardingCompletedAt DateTime?
  dismissedTips         String[]  @default([])
}
```

**Shared Types (`@repo/core`):**

```typescript
type OnboardingTipId =
  | 'dashboard_first_visit'
  | 'expenses_no_categories'
  | 'summary_first_visit'
  | 'budget_progress_bar'
  | 'members_invite_button'
  | 'category_budget_limit';

const ONBOARDING_TIP_IDS: readonly OnboardingTipId[];

interface DefaultCategory {
  nameKey: string;  // i18n key
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: readonly DefaultCategory[];
```

**Frontend Type Extension (`@repo/api-client`):**

```typescript
interface UserMe {
  // ... existing fields
  onboardingCompletedAt: string | null;
  dismissedTips: string[];
}
```

### API Endpoints

All endpoints require `JwtAuthGuard`. Controller prefix: `onboarding`.

| Method | Path | Description | Request | Response |
|--------|------|-------------|---------|----------|
| `PATCH` | `/onboarding/complete` | Mark wizard complete | — | `204 No Content` |
| `PATCH` | `/onboarding/tips/:tipId/dismiss` | Dismiss a tip | `tipId` param (validated against `OnboardingTipId`) | `204 No Content` |
| `PATCH` | `/onboarding/tips/reset` | Re-enable all tips | — | `204 No Content` |

**Validation:** The `:tipId` param is validated against the `OnboardingTipId` set. Unknown tip IDs return `400 Bad Request`.

**Existing endpoints used by the wizard (no changes):**
- `PATCH /users/me` — Update user name (step 1)
- `POST /travels` — Create trip (step 2)
- `POST /travels/:id/categories` — Create categories (step 3, called sequentially per category)

### Routing Design

**`_authenticated` layout route update:**

The existing component-level auth check is migrated to `beforeLoad` for both auth and onboarding redirects:

```typescript
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    const user = await context.auth.ensureUser();
    if (!user.onboardingCompletedAt && location.pathname !== '/onboarding') {
      throw redirect({ to: '/onboarding' });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});
```

**New route file:** `src/apps/web/src/routes/_authenticated/onboarding.tsx` — renders the `OnboardingWizard` from `@repo/features`.

### UI Component Design

**InlineTip** (`@repo/ui/molecules/`):
- Props: `tipId`, `message` (i18n key), `ctaLabel?`, `onCtaPress?`, `onDismiss`
- Renders a dismissible card with icon, text, optional CTA button
- Uses `AnimatePresence` with `enterStyle` (opacity: 0, y: 10) and `exitStyle` (opacity: 0, y: -10)

**TooltipTip** (`@repo/ui/molecules/`):
- Props: `tipId`, `message` (i18n key), `onDismiss`, `anchorRef`
- Renders a bubble positioned relative to the anchor element
- Auto-positions (top/bottom) based on available viewport space
- Uses `AnimatePresence` for fade in/out

**Wizard Step Components** (`@repo/ui/templates/`):
- `OnboardingWelcomeView` — Welcome screen with optional name input
- `OnboardingTripFormView` — Trip creation with field groups
- `OnboardingCategoriesView` — Category grid with toggle/edit
- `OnboardingReadyView` — Celebration screen with quick actions

**Wizard Container** (`@repo/features/onboarding/`):
- `OnboardingWizard` — Manages step state (1-4), skip logic, API calls
- `useTip` hook — Reads `dismissedTips` from `useUserMe()` cache, calls dismiss endpoint

### Wizard State Management

The wizard uses local `useState` for the current step (1-4) — not URL-based. Data created in step 2 (trip ID) is passed to step 3 via local state. No global state store needed.

**Step transitions:**
- Step 1 -> 2: After name save (if needed) or directly
- Step 2 -> 3: After `POST /travels` returns the created trip
- Step 3 -> 4: After sequential `POST /travels/:id/categories` calls complete
- Step 4 -> done: After `PATCH /onboarding/complete`, navigate to selected destination

**Skip at any step:** Calls `PATCH /onboarding/complete`, then `navigate({ to: '/travels' })`.

## Integration Points

No external integrations required. All endpoints are internal. The wizard reuses existing travel and category creation APIs without modification.

**Query cache invalidation:** After completing onboarding or dismissing a tip, invalidate `queryKeys.users.me` to keep `onboardingCompletedAt` and `dismissedTips` in sync. Tip dismissals use optimistic updates for instant UI feedback.

## Testing Approach

### Unit Tests

**API (`*.spec.ts`):**
- `OnboardingService`: test `completeOnboarding` sets timestamp, `dismissTip` validates tip ID and appends to array (idempotent), `resetTips` clears array
- `OnboardingRepository`: test Prisma calls with mocked PrismaService

**Frontend:**
- `useTip` hook: test `shouldShow` logic (tip not in dismissed list), test `dismiss` triggers mutation
- Wizard step components: render tests, form validation, button states

### Integration Tests

**API:** Test the three onboarding endpoints through HTTP:
- Complete onboarding -> verify `onboardingCompletedAt` is set
- Dismiss tip -> verify tip added to `dismissedTips`
- Dismiss same tip twice -> verify idempotent (no duplicates)
- Dismiss invalid tip ID -> verify 400
- Reset tips -> verify array cleared

### E2E Tests

**Playwright scenarios:**
1. New user login -> redirected to wizard -> complete all 4 steps -> lands on trip dashboard
2. New user login -> skip at step 1 -> lands on travels list
3. Returning user -> no wizard redirect -> sees contextual tip on dashboard -> dismisses it
4. Profile settings -> replay onboarding -> redirected to wizard

## Development Sequencing

### Build Order

1. **Prisma migration** — Add `onboardingCompletedAt` and `dismissedTips` fields to User model. Non-breaking (both nullable/defaulted).
2. **`@repo/core` types & constants** — `OnboardingTipId`, `DEFAULT_CATEGORIES`, i18n keys in `en.json` and `pt-BR.json`.
3. **API `OnboardingModule`** — Repository, service, controller with 3 endpoints. Tests.
4. **`@repo/api-client` extension** — Update `UserMe` type, add onboarding API methods and hooks.
5. **`@repo/ui` components** — `InlineTip`, `TooltipTip`, wizard step views (templates).
6. **`@repo/features/onboarding`** — `OnboardingWizard` container, `useTip` hook.
7. **Web routing** — Update `_authenticated` `beforeLoad`, add `/onboarding` route.
8. **Contextual tips integration** — Add `useTip` + `InlineTip`/`TooltipTip` to existing pages (dashboard, expenses, summary, budget, members, categories).
9. **Profile settings** — Add "Replay onboarding" and "Reset tips" buttons.
10. **E2E tests** — Playwright scenarios for wizard flow and tip interactions.

### Technical Dependencies

- Prisma migration must run before API module development
- `@repo/core` types must be published before API client and UI work
- API endpoints must be available before frontend integration
- No external service dependencies

## Monitoring and Observability

- **Logs:** INFO-level log on onboarding completion and tip dismissal (userId, tipId). WARN on invalid tip ID attempts.
- **Metrics:** No new Prometheus metrics in this iteration (analytics deferred per PRD).
- **Error tracking:** Invalid tip IDs and failed onboarding completions logged as warnings for detection of client bugs.

## Technical Considerations

### Key Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| Postgres `String[]` for `dismissedTips` | Bounded set (~6 IDs), no joins needed, simple queries | Separate join table — overkill for this cardinality |
| New `OnboardingModule` in API | Clean separation of onboarding concerns from user profile management | Extending UsersController — would bloat an already complete module |
| `beforeLoad` redirect in `_authenticated` | Runs before any child route renders, prevents flash of content, follows TanStack Router best practice | Client-side redirect in AuthProvider — causes flash, harder to test |
| Local `useState` for wizard steps | Simple, no URL pollution, wizard is linear and non-bookmarkable | URL-based steps — unnecessary complexity for a sequential flow |
| Sequential category creation (no batch endpoint) | Reuses existing API, avoids new endpoint, acceptable for ~6 items | New batch endpoint — over-engineering for the onboarding context |
| `AnimatePresence` for tip animations | Native Tamagui solution, works cross-platform, matches existing animation patterns | CSS transitions — not portable to React Native |

### Known Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `beforeLoad` adds a network call (fetch user) on every navigation | Slight latency on route transitions | User data is cached by React Query; `beforeLoad` reads from cache after first load |
| Sequential category creation may feel slow on poor connections | Step 3 completion delay | Show progress indicator per category; categories are small payloads |
| Tooltip positioning edge cases on small screens | Tooltip may overflow viewport | Auto-position logic with viewport boundary detection; fallback to inline card on mobile |

### Standard Skills Compliance

- **`react`** — Functional components, hooks-based state, no React.FC, proper cleanup
- **`nestjs-best-practices`** — Module-per-domain, repository pattern, Symbol-based DI, guard chain
- **`tamagui`** — Styled components, design tokens, AnimatePresence for animations
- **`atomic-design-fundamentals`** — Tips as molecules, wizard views as templates, wizard container as feature
- **`clean-ddd-hexagonal`** — Repository interface/implementation split, service layer for business logic

### Relevant and dependent files

**Backend (API):**
- `src/apps/api/prisma/schema.prisma` — User model extension
- `src/apps/api/src/modules/users/repository/user.repository.interface.ts` — Reference for repository pattern
- `src/apps/api/src/modules/users/users.controller.ts` — Reference for controller pattern
- `src/apps/api/src/modules/users/dto/user-me.dto.ts` — Needs `onboardingCompletedAt` and `dismissedTips` fields
- `src/apps/api/src/modules/common/auth/jwt-auth.guard.ts` — Used by new controller
- `src/apps/api/src/app.module.ts` — Register new OnboardingModule

**Shared packages:**
- `src/packages/core/src/types/` — New `OnboardingTipId` type
- `src/packages/core/src/constants/` — New `DEFAULT_CATEGORIES` constant
- `src/packages/core/src/i18n/en.json` — Onboarding i18n keys
- `src/packages/core/src/i18n/pt-BR.json` — Onboarding i18n keys (Portuguese)

**API Client:**
- `src/packages/api-client/src/types/index.ts` — Extend `UserMe` interface
- `src/packages/api-client/src/client.ts` — Add onboarding API methods
- `src/packages/api-client/src/queryKeys.ts` — Add onboarding query keys
- `src/packages/api-client/src/hooks/` — New onboarding hooks

**UI Components:**
- `src/packages/ui/src/molecules/` — New `InlineTip`, `TooltipTip`
- `src/packages/ui/src/templates/` — New wizard step views

**Features:**
- `src/packages/features/src/onboarding/` — New wizard container + useTip hook
- `src/packages/features/src/dashboard/DashboardPage.tsx` — Add `dashboard_first_visit` tip
- `src/packages/features/src/expenses/` — Add `expenses_no_categories` tip
- `src/packages/features/src/summary/TripSummaryPage.tsx` — Add `summary_first_visit` tip
- `src/packages/features/src/budget/` — Add `budget_progress_bar` tip
- `src/packages/features/src/members/MembersPage.tsx` — Add `members_invite_button` tip
- `src/packages/features/src/categories/CategoriesPage.tsx` — Add `category_budget_limit` tip

**Web App:**
- `src/apps/web/src/routes/_authenticated.tsx` — Add `beforeLoad` redirect logic
- `src/apps/web/src/routes/_authenticated/onboarding.tsx` — New route file
- `src/apps/web/src/features/profile/` — Add replay/reset buttons
