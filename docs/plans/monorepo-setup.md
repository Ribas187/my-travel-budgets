# Monorepo Setup + Shared Packages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a Turborepo monorepo with scaffolded apps (web, mobile, API) and shared packages (ui, core, api-client) ready for feature development.

**Architecture:** Turborepo with pnpm workspaces. Three apps (`apps/web` React+Vite, `apps/mobile` Expo, `apps/api` NestJS+Prisma) sharing code via three packages (`packages/ui` Tamagui components, `packages/core` types+validation, `packages/api-client` typed HTTP client). Shared TypeScript config in `packages/typescript-config`.

**Tech Stack:** Turborepo, pnpm, TypeScript, React, Vite, Expo SDK 55, NestJS 11, Prisma 7, Tamagui, Zod

---

## File Structure

```
my-travel-budgets/
├── .npmrc
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       └── main.tsx
│   ├── mobile/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   └── app/
│   │       └── index.tsx
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json
│       ├── prisma/
│       │   └── schema.prisma
│       ├── src/
│       │   ├── main.ts
│       │   └── app.module.ts
│       └── test/
│           └── app.e2e-spec.ts
├── packages/
│   ├── typescript-config/
│   │   ├── package.json
│   │   ├── base.json
│   │   ├── react.json
│   │   ├── expo.json
│   │   ├── nestjs.json
│   │   └── library.json
│   ├── core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── schemas/
│   │       │   ├── user.ts
│   │       │   ├── travel.ts
│   │       │   ├── category.ts
│   │       │   ├── expense.ts
│   │       │   └── member.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── constants/
│   │           └── currencies.ts
│   ├── ui/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── tamagui.config.ts
│   └── api-client/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
```

---

### Task 1: Initialize Root Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Create: `turbo.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "my-travel-budgets",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:generate": "turbo run db:generate",
    "db:migrate": "turbo run db:migrate"
  },
  "devDependencies": {
    "turbo": "^2.4.4"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create `.npmrc`**

```ini
node-linker=hoisted
```

This is required for Expo/React Native compatibility with pnpm.

- [ ] **Step 4: Create `turbo.json`**

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalEnv": ["DATABASE_URL", "JWT_SECRET", "RESEND_API_KEY", "CLOUDINARY_URL"],
  "tasks": {
    "build": {
      "dependsOn": ["^build", "^db:generate"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^db:generate"]
    },
    "lint": {},
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
node_modules/
dist/
.turbo/
.expo/
.env
.env.*
!.env.example
coverage/
*.tsbuildinfo
```

- [ ] **Step 6: Install turbo and verify**

Run: `pnpm install`
Expected: `node_modules` created, `pnpm-lock.yaml` generated.

Run: `pnpm turbo --version`
Expected: Prints turbo version 2.x.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc turbo.json .gitignore pnpm-lock.yaml
git commit -m "feat: initialize turborepo monorepo root"
```

---

### Task 2: Shared TypeScript Config Package

**Files:**
- Create: `packages/typescript-config/package.json`
- Create: `packages/typescript-config/base.json`
- Create: `packages/typescript-config/react.json`
- Create: `packages/typescript-config/expo.json`
- Create: `packages/typescript-config/nestjs.json`
- Create: `packages/typescript-config/library.json`

- [ ] **Step 1: Create `packages/typescript-config/package.json`**

```json
{
  "name": "@repo/typescript-config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./base.json": "./base.json",
    "./react.json": "./react.json",
    "./expo.json": "./expo.json",
    "./nestjs.json": "./nestjs.json",
    "./library.json": "./library.json"
  }
}
```

- [ ] **Step 2: Create `packages/typescript-config/base.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 3: Create `packages/typescript-config/react.json`**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  }
}
```

- [ ] **Step 4: Create `packages/typescript-config/expo.json`**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ESNext"],
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 5: Create `packages/typescript-config/nestjs.json`**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "target": "ES2021",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "declaration": false,
    "declarationMap": false,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

- [ ] **Step 6: Create `packages/typescript-config/library.json`**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add packages/typescript-config/
git commit -m "feat: add shared typescript-config package"
```

---

### Task 3: Core Package (Types, Schemas, Constants)

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/schemas/user.ts`
- Create: `packages/core/src/schemas/travel.ts`
- Create: `packages/core/src/schemas/category.ts`
- Create: `packages/core/src/schemas/expense.ts`
- Create: `packages/core/src/schemas/member.ts`
- Create: `packages/core/src/types/index.ts`
- Create: `packages/core/src/constants/currencies.ts`

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "@repo/core",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/library.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Write the failing test for user schema**

Create `packages/core/src/schemas/__tests__/user.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createUserSchema, updateUserSchema } from '../user'

describe('User schemas', () => {
  it('validates a valid create user payload', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      name: 'John Doe',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = createUserSchema.safeParse({
      email: 'not-an-email',
      name: 'John Doe',
    })
    expect(result.success).toBe(false)
  })

  it('validates update user with optional fields', () => {
    const result = updateUserSchema.safeParse({
      name: 'Jane Doe',
    })
    expect(result.success).toBe(true)
  })

  it('validates update user with avatarUrl', () => {
    const result = updateUserSchema.safeParse({
      avatarUrl: 'https://example.com/avatar.jpg',
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/user.test.ts`
Expected: FAIL — module `../user` not found.

- [ ] **Step 5: Implement user schema**

Create `packages/core/src/schemas/user.ts`:

```typescript
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/user.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 7: Write the failing test for travel schema**

Create `packages/core/src/schemas/__tests__/travel.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createTravelSchema, updateTravelSchema } from '../travel'

describe('Travel schemas', () => {
  it('validates a valid create travel payload', () => {
    const result = createTravelSchema.safeParse({
      name: 'Paris Trip',
      currency: 'EUR',
      budget: 3000,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = createTravelSchema.safeParse({
      name: 'Paris Trip',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid currency code', () => {
    const result = createTravelSchema.safeParse({
      name: 'Trip',
      currency: 'INVALID',
      budget: 1000,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative budget', () => {
    const result = createTravelSchema.safeParse({
      name: 'Trip',
      currency: 'USD',
      budget: -100,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })
    expect(result.success).toBe(false)
  })

  it('validates update with optional fields', () => {
    const result = updateTravelSchema.safeParse({
      name: 'Updated Name',
      imageUrl: 'https://example.com/photo.jpg',
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 8: Run test to verify it fails**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/travel.test.ts`
Expected: FAIL — module `../travel` not found.

- [ ] **Step 9: Implement travel schema**

Create `packages/core/src/schemas/travel.ts`:

```typescript
import { z } from 'zod'
import { SUPPORTED_CURRENCIES } from '../constants/currencies'

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]]

export const createTravelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  currency: z.enum(currencyCodes),
  budget: z.number().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
})

export const updateTravelSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  currency: z.enum(currencyCodes).optional(),
  budget: z.number().positive().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
})

export type CreateTravelInput = z.infer<typeof createTravelSchema>
export type UpdateTravelInput = z.infer<typeof updateTravelSchema>
```

- [ ] **Step 10: Implement currencies constant (dependency of travel schema)**

Create `packages/core/src/constants/currencies.ts`:

```typescript
export interface Currency {
  code: string
  name: string
  symbol: string
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'CO$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CL$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
]
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/travel.test.ts`
Expected: PASS — all 5 tests pass.

- [ ] **Step 12: Write the failing test for category schema**

Create `packages/core/src/schemas/__tests__/category.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createCategorySchema, updateCategorySchema } from '../category'

describe('Category schemas', () => {
  it('validates a valid create category payload', () => {
    const result = createCategorySchema.safeParse({
      name: 'Food',
      icon: 'utensils',
      color: '#FF5733',
    })
    expect(result.success).toBe(true)
  })

  it('validates create with optional budgetLimit', () => {
    const result = createCategorySchema.safeParse({
      name: 'Transport',
      icon: 'car',
      color: '#3498DB',
      budgetLimit: 500,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative budgetLimit', () => {
    const result = createCategorySchema.safeParse({
      name: 'Food',
      icon: 'utensils',
      color: '#FF5733',
      budgetLimit: -10,
    })
    expect(result.success).toBe(false)
  })

  it('validates update with partial fields', () => {
    const result = updateCategorySchema.safeParse({
      budgetLimit: 200,
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 13: Run test to verify it fails**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/category.test.ts`
Expected: FAIL — module `../category` not found.

- [ ] **Step 14: Implement category schema**

Create `packages/core/src/schemas/category.ts`:

```typescript
import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  budgetLimit: z.number().positive().nullable().optional(),
  icon: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  budgetLimit: z.number().positive().nullable().optional(),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
```

- [ ] **Step 15: Run test to verify it passes**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/category.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 16: Write the failing test for expense schema**

Create `packages/core/src/schemas/__tests__/expense.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createExpenseSchema, updateExpenseSchema } from '../expense'

describe('Expense schemas', () => {
  it('validates a valid create expense payload', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      memberId: '550e8400-e29b-41d4-a716-446655440001',
      amount: 45.5,
      description: 'Dinner at restaurant',
      date: '2026-06-05',
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero amount', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      memberId: '550e8400-e29b-41d4-a716-446655440001',
      amount: 0,
      description: 'Free thing',
      date: '2026-06-05',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid UUID for categoryId', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: 'not-a-uuid',
      memberId: '550e8400-e29b-41d4-a716-446655440001',
      amount: 10,
      description: 'Test',
      date: '2026-06-05',
    })
    expect(result.success).toBe(false)
  })

  it('validates update with partial fields', () => {
    const result = updateExpenseSchema.safeParse({
      amount: 50,
      description: 'Updated description',
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 17: Run test to verify it fails**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/expense.test.ts`
Expected: FAIL — module `../expense` not found.

- [ ] **Step 18: Implement expense schema**

Create `packages/core/src/schemas/expense.ts`:

```typescript
import { z } from 'zod'

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  date: z.string().date(),
})

export const updateExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  date: z.string().date().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
```

- [ ] **Step 19: Run test to verify it passes**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/expense.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 20: Write the failing test for member schema**

Create `packages/core/src/schemas/__tests__/member.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { addMemberSchema } from '../member'

describe('Member schemas', () => {
  it('validates adding a registered member by email', () => {
    const result = addMemberSchema.safeParse({
      email: 'friend@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('validates adding a guest by name', () => {
    const result = addMemberSchema.safeParse({
      guestName: 'Bob',
    })
    expect(result.success).toBe(true)
  })

  it('rejects payload with both email and guestName', () => {
    const result = addMemberSchema.safeParse({
      email: 'friend@example.com',
      guestName: 'Bob',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty payload', () => {
    const result = addMemberSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 21: Run test to verify it fails**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/member.test.ts`
Expected: FAIL — module `../member` not found.

- [ ] **Step 22: Implement member schema**

Create `packages/core/src/schemas/member.ts`:

```typescript
import { z } from 'zod'

export const addMemberSchema = z
  .object({
    email: z.string().email().optional(),
    guestName: z.string().min(1).max(100).optional(),
  })
  .refine((data) => {
    const hasEmail = data.email !== undefined
    const hasGuest = data.guestName !== undefined
    return (hasEmail || hasGuest) && !(hasEmail && hasGuest)
  }, 'Provide either email or guestName, not both')

export type AddMemberInput = z.infer<typeof addMemberSchema>
```

- [ ] **Step 23: Run test to verify it passes**

Run: `cd packages/core && pnpm vitest run src/schemas/__tests__/member.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 24: Create types barrel export**

Create `packages/core/src/types/index.ts`:

```typescript
export type { CreateUserInput, UpdateUserInput } from '../schemas/user'
export type { CreateTravelInput, UpdateTravelInput } from '../schemas/travel'
export type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category'
export type { CreateExpenseInput, UpdateExpenseInput } from '../schemas/expense'
export type { AddMemberInput } from '../schemas/member'
export type { Currency } from '../constants/currencies'

export type MemberRole = 'owner' | 'member'
```

- [ ] **Step 25: Create package barrel export**

Create `packages/core/src/index.ts`:

```typescript
export * from './schemas/user'
export * from './schemas/travel'
export * from './schemas/category'
export * from './schemas/expense'
export * from './schemas/member'
export * from './constants/currencies'
export * from './types/index'
```

- [ ] **Step 26: Run all core tests**

Run: `cd packages/core && pnpm vitest run`
Expected: PASS — all tests pass.

- [ ] **Step 27: Commit**

```bash
git add packages/core/
git commit -m "feat: add core package with Zod schemas, types, and constants"
```

---

### Task 4: UI Package (Tamagui Config + Shell)

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/tamagui.config.ts`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "tamagui": "^1.141.5",
    "@tamagui/config": "^1.141.5"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/react.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/ui/src/tamagui.config.ts`**

```typescript
import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'

export const config = createTamagui({
  ...defaultConfig,
  // Custom theme tokens will be defined in Plan 2 (Design System)
})

export default config

type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
```

- [ ] **Step 4: Create `packages/ui/src/index.ts`**

```typescript
export { config } from './tamagui.config'

// Shared components will be added in Plan 2 (Design System)
```

- [ ] **Step 5: Commit**

```bash
git add packages/ui/
git commit -m "feat: add ui package with Tamagui config shell"
```

---

### Task 5: API Client Package (Shell)

**Files:**
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/tsconfig.json`
- Create: `packages/api-client/src/index.ts`

- [ ] **Step 1: Create `packages/api-client/package.json`**

```json
{
  "name": "@repo/api-client",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/core": "workspace:*"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create `packages/api-client/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/library.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/api-client/src/index.ts`**

```typescript
// API client will be implemented in Plan 3 (Backend API)
// after endpoints are defined and tested
export const API_VERSION = 'v1'
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-client/
git commit -m "feat: add api-client package shell"
```

---

### Task 6: Scaffold Web App (React + Vite)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@app/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "tsc --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tamagui": "^1.141.5",
    "@tamagui/vite-plugin": "^1.141.5",
    "@repo/ui": "workspace:*",
    "@repo/core": "workspace:*",
    "@repo/api-client": "workspace:*"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tamaguiPlugin } from '@tamagui/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tamaguiPlugin({
      config: './src/tamagui.config.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Create `apps/web/src/tamagui.config.ts`**

```typescript
// Re-export the shared config so Vite plugin can find it
export { config as default } from '@repo/ui'
```

- [ ] **Step 5: Create `apps/web/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Travel Budgets</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `apps/web/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TamaguiProvider } from 'tamagui'
import { config } from '@repo/ui'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TamaguiProvider config={config}>
      <App />
    </TamaguiProvider>
  </StrictMode>,
)
```

- [ ] **Step 7: Create `apps/web/src/App.tsx`**

```tsx
import { YStack, H1, Paragraph } from 'tamagui'

export function App() {
  return (
    <YStack padding="$4" alignItems="center" justifyContent="center" flex={1}>
      <H1>My Travel Budgets</H1>
      <Paragraph>Web app is running.</Paragraph>
    </YStack>
  )
}
```

- [ ] **Step 8: Install dependencies and verify dev server starts**

Run: `cd /Users/ribas/Documents/projects/my-travel-budgets && pnpm install`
Expected: All dependencies installed.

Run: `cd apps/web && pnpm dev`
Expected: Vite dev server starts on `http://localhost:5173`, page renders "My Travel Budgets".

- [ ] **Step 9: Commit**

```bash
git add apps/web/
git commit -m "feat: scaffold web app with React, Vite, and Tamagui"
```

---

### Task 7: Scaffold Mobile App (Expo)

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/babel.config.js`
- Create: `apps/mobile/app/index.tsx`

- [ ] **Step 1: Create `apps/mobile/package.json`**

```json
{
  "name": "@app/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "build": "expo export",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~55.0.0",
    "expo-router": "~5.0.0",
    "react": "^19.0.0",
    "react-native": "0.79.0",
    "tamagui": "^1.141.5",
    "@tamagui/babel-plugin": "^1.141.5",
    "@repo/ui": "workspace:*",
    "@repo/core": "workspace:*",
    "@repo/api-client": "workspace:*"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

Note: Exact Expo SDK and React Native versions should be verified against the latest Expo SDK at implementation time. Use `npx create-expo-app --template` to get correct peer versions if needed.

- [ ] **Step 2: Create `apps/mobile/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/expo.json",
  "include": ["app", "src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/mobile/app.json`**

```json
{
  "expo": {
    "name": "My Travel Budgets",
    "slug": "my-travel-budgets",
    "version": "1.0.0",
    "scheme": "mybudgets",
    "platforms": ["ios", "android"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 4: Create `apps/mobile/babel.config.js`**

```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: '../../packages/ui/src/tamagui.config.ts',
        },
      ],
    ],
  }
}
```

- [ ] **Step 5: Create `apps/mobile/app/index.tsx`**

```tsx
import { TamaguiProvider, YStack, H1, Paragraph } from 'tamagui'
import { config } from '@repo/ui'

export default function HomeScreen() {
  return (
    <TamaguiProvider config={config}>
      <YStack padding="$4" alignItems="center" justifyContent="center" flex={1}>
        <H1>My Travel Budgets</H1>
        <Paragraph>Mobile app is running.</Paragraph>
      </YStack>
    </TamaguiProvider>
  )
}
```

- [ ] **Step 6: Install and verify Expo starts**

Run: `cd /Users/ribas/Documents/projects/my-travel-budgets && pnpm install`
Expected: All dependencies installed.

Run: `cd apps/mobile && pnpm dev`
Expected: Expo dev server starts, QR code shown. Scanning with Expo Go renders "My Travel Budgets".

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/
git commit -m "feat: scaffold mobile app with Expo and Tamagui"
```

---

### Task 8: Scaffold API App (NestJS + Prisma)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/app.controller.ts`
- Create: `apps/api/test/app.e2e-spec.ts`
- Create: `apps/api/.env.example`

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@app/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "lint": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@prisma/client": "^7.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "@repo/core": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@repo/typescript-config": "workspace:*",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "prisma": "^7.0.0",
    "ts-jest": "^29.2.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/nestjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "test"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 4: Create `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  travels    Travel[]
  memberships TravelMember[]
}

model Travel {
  id          String   @id @default(uuid())
  name        String
  description String?
  imageUrl    String?
  currency    String
  budget      Decimal  @db.Decimal(12, 2)
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  createdBy  User           @relation(fields: [createdById], references: [id])
  members    TravelMember[]
  categories Category[]
  expenses   Expense[]
}

model TravelMember {
  id        String   @id @default(uuid())
  travelId  String
  userId    String?
  guestName String?
  role      String   @default("member")
  createdAt DateTime @default(now())

  travel   Travel    @relation(fields: [travelId], references: [id], onDelete: Cascade)
  user     User?     @relation(fields: [userId], references: [id])
  expenses Expense[]

  @@unique([travelId, userId])
}

model Category {
  id          String   @id @default(uuid())
  travelId    String
  name        String
  budgetLimit Decimal? @db.Decimal(12, 2)
  icon        String
  color       String
  createdAt   DateTime @default(now())

  travel   Travel    @relation(fields: [travelId], references: [id], onDelete: Cascade)
  expenses Expense[]
}

model Expense {
  id          String   @id @default(uuid())
  travelId    String
  categoryId  String
  memberId    String
  amount      Decimal  @db.Decimal(12, 2)
  description String
  date        DateTime @db.Date
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  travel   Travel       @relation(fields: [travelId], references: [id], onDelete: Cascade)
  category Category     @relation(fields: [categoryId], references: [id])
  member   TravelMember @relation(fields: [memberId], references: [id])
}

model MagicLink {
  id        String    @id @default(uuid())
  email     String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
}
```

- [ ] **Step 5: Create `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'

@Module({
  controllers: [AppController],
})
export class AppModule {}
```

- [ ] **Step 6: Create `apps/api/src/app.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok' }
  }
}
```

- [ ] **Step 7: Create `apps/api/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
```

- [ ] **Step 8: Create `apps/api/.env.example`**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/travel_budgets
JWT_SECRET=your-secret-here
RESEND_API_KEY=re_your_key_here
CLOUDINARY_URL=cloudinary://your_key:your_secret@your_cloud
PORT=3000
```

- [ ] **Step 9: Write e2e test for health endpoint**

Create `apps/api/test/app.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' })
  })
})
```

Create `apps/api/test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

- [ ] **Step 10: Install dependencies and run the e2e test**

Run: `cd /Users/ribas/Documents/projects/my-travel-budgets && pnpm install`
Expected: All dependencies installed.

Run: `cd apps/api && pnpm test:e2e`
Expected: PASS — health endpoint returns `{ status: 'ok' }`.

- [ ] **Step 11: Commit**

```bash
git add apps/api/
git commit -m "feat: scaffold API app with NestJS, Prisma schema, and health endpoint"
```

---

### Task 9: Verify Full Monorepo Build

- [ ] **Step 1: Install all dependencies from root**

Run: `pnpm install`
Expected: All workspaces resolved and installed.

- [ ] **Step 2: Run turbo build**

Run: `pnpm build`
Expected: All packages and apps build successfully. Turbo shows task summary with no errors.

- [ ] **Step 3: Run turbo lint**

Run: `pnpm lint`
Expected: No TypeScript errors across any workspace.

- [ ] **Step 4: Run turbo test**

Run: `pnpm test`
Expected: All core package tests pass. API e2e test passes.

- [ ] **Step 5: Final commit with any fixes**

If any fixes were needed:

```bash
git add <specific-files-that-were-fixed>
git commit -m "fix: resolve monorepo build issues"
```

If everything passed clean, no commit needed.
