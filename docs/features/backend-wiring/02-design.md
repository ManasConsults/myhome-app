# Feature Design: Backend Wiring

**Date:** 2026-04-25
**Status:** APPROVED
**Plan:** [01-plan.md](./01-plan.md)

---

## Overview

Five phases, executed in order. Each phase is self-contained — no half-wired states.

---

## Phase 1 — Schema Patch + Seed

### 1a. Prisma schema change

Add `status` to `User` model (needed for registration approval flow):

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String?
  role      String   @default("user")
  status    String   @default("active")   // NEW: "pending" | "active" | "rejected"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  groups    Group[]
}
```

Run: `npx prisma migrate dev --name add-user-status`

### 1b. Package additions

```bash
npm install @tanstack/react-query
```

Add seed script to `package.json`:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

### 1c. Seed script — `prisma/seed.ts`

Uses `upsert` throughout — safe to re-run. Order:
1. Seed user (User)
2. Groups (g1, g2)
3. AppEvents (ev1, ev2)
4. Recipes (no groupId)
5. All feature data: budgets, expenses, incomes, loans, loanRepayments, tasks, shoppingItems, notes, calendarEvents, dayMeals

Date values: convert `"YYYY-MM-DD"` strings to `new Date(str)` for Prisma DateTime fields.
`DayMeals` upsert key: `{ groupId_eventId_day: { groupId, eventId: null, day } }` — note `eventId: null` requires using `{ groupId, eventId: null, day }` in the where clause.

---

## Phase 2 — Auth Migration

### 2a. Slim down `lib/dummy-users.ts`

**Keep** (used by `proxy.ts`, `AuthProvider`):
- `UserRole`, `UserStatus`, `SessionPayload` types
- `SESSION_COOKIE`, `SESSION_MAX_AGE` constants
- `encodeSession()`, `decodeSession()`

**Remove** (replaced by `lib/actions/auth.ts`):
- `DummyUser` type → moves to `lib/actions/auth.ts`
- `SEED_USER`, `STORAGE_KEY`, all localStorage functions
- `getRegisteredUsers`, `registerUser`, `findUser`, `findUserByEmail`, `findUserByEmailAny`
- `approveUser`, `rejectUser`, `updateUserRole`, `deleteUser`
- `AppSettings` type + helpers → keep in `lib/dummy-users.ts` for now (localStorage-backed app settings stay as-is in this phase)

### 2b. New `lib/actions/auth.ts`

```ts
"use server"
import { prisma } from "@/lib/db/prisma"
import type { SessionPayload, UserRole, UserStatus } from "@/lib/dummy-users"

export type UserRecord = {
  id: string; name: string; email: string; role: UserRole
  status: UserStatus; createdAt: string
}

export async function loginAction(email: string, password: string)
  : Promise<{ success: true; user: SessionPayload } | { success: false; error: string }>

export async function registerAction(data: { name: string; email: string; password: string })
  : Promise<{ success: true } | { success: false; error: string }>
  // Creates user with status: "pending", role: "user"

export async function getUsers(): Promise<UserRecord[]>
  // Returns all users ordered by createdAt — seed user (role=admin) always first

export async function approveUser(userId: string): Promise<{ success: boolean }>
export async function rejectUser(userId: string): Promise<{ success: boolean }>
export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean }>
export async function deleteUser(userId: string): Promise<{ success: boolean }>
  // Guard: seed user (first admin, id hardcoded from seed) cannot be deleted/mutated
```

The seed user's ID is known at seed time — we upsert with a fixed cuid, e.g. the current `"user-1"` string if Prisma allows it, or we use `findFirst({ where: { email: "demo@myhome.app" } })` as the guard.

### 2c. Update `components/providers/AuthProvider.tsx`

Remove `findUserByEmail` import (the role backfill is no longer needed — all new cookies will have role). Keep everything else.

### 2d. Update `app/login/page.tsx`

Replace direct `findUser()` + `findUserByEmailAny()` calls with `loginAction()`:

```tsx
const result = await loginAction(email, password)
if (!result.success) {
  setError(result.error)
  return
}
setUser(result.user)
router.push("/")
```

### 2e. Update `app/register/page.tsx`

Replace `findUserByEmail()` + `registerUser()` with `registerAction()`:

```tsx
const result = await registerAction({ name, email, password })
if (!result.success) {
  setError(result.error)
  return
}
setSubmitted(true)
```

---

## Phase 3 — Server Actions

### Structure

```
lib/actions/
  auth.ts       (Phase 2 — done)
  groups.ts
  events.ts
  tasks.ts
  shopping.ts
  notes.ts
  calendar.ts
  finance.ts    (budgets + expenses + income + loans + repayments)
  meals.ts      (recipes + weekly plan)
```

### Date serialization utility — `lib/utils.ts`

Add:
```ts
export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}
```

### Action return type convention

```ts
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
```

### `lib/actions/groups.ts`

```ts
"use server"
export async function getGroups(userId: string): Promise<Group[]>
export async function createGroup(userId: string, data: Omit<Group, "id"|"userId"|"createdAt"|"updatedAt">): Promise<ActionResult<Group>>
export async function updateGroup(id: string, data: Partial<Group>): Promise<ActionResult<Group>>
export async function deleteGroup(id: string): Promise<ActionResult<void>>
  // Guard: cannot delete group where isDefault=true
```

### `lib/actions/events.ts`

```ts
"use server"
export async function getEvents(groupId: string): Promise<AppEvent[]>
  // or getEventsByUser(userId) — returns all events for all groups of user
export async function createEvent(data: Omit<AppEvent, "id"|"createdAt"|"updatedAt">): Promise<ActionResult<AppEvent>>
export async function updateEvent(id: string, data: Partial<AppEvent>): Promise<ActionResult<AppEvent>>
export async function deleteEvent(id: string): Promise<ActionResult<void>>
```

### `lib/actions/tasks.ts`

```ts
"use server"
export async function getTasks(groupId: string, eventId?: string): Promise<Task[]>
export async function createTask(data: Omit<Task,"id"|"createdAt"|"updatedAt">): Promise<ActionResult<Task>>
export async function updateTask(id: string, data: Partial<Task>): Promise<ActionResult<Task>>
export async function deleteTask(id: string): Promise<ActionResult<void>>
```

(Same shape for `shopping.ts`, `notes.ts`, `calendar.ts`)

### `lib/actions/finance.ts`

```ts
"use server"
// Budgets
export async function getBudgets(groupId: string, eventId?: string): Promise<Budget[]>
export async function createBudget(data: ...): Promise<ActionResult<Budget>>
export async function updateBudget(id: string, data: ...): Promise<ActionResult<Budget>>
export async function deleteBudget(id: string): Promise<ActionResult<void>>

// Expenses
export async function getExpenses(groupId: string, eventId?: string): Promise<Expense[]>
export async function createExpense(data: ...): Promise<ActionResult<Expense>>
export async function updateExpense(id: string, data: ...): Promise<ActionResult<Expense>>
export async function deleteExpense(id: string): Promise<ActionResult<void>>

// Income
export async function getIncomes(groupId: string, eventId?: string): Promise<Income[]>
export async function createIncome(data: ...): Promise<ActionResult<Income>>
export async function updateIncome(id: string, data: ...): Promise<ActionResult<Income>>
export async function deleteIncome(id: string): Promise<ActionResult<void>>

// Loans
export async function getLoans(groupId: string, eventId?: string): Promise<Loan[]>
export async function getLoanRepayments(loanId: string): Promise<LoanRepayment[]>
  // or getAllRepayments(groupId) to fetch all at once
export async function createLoan(data: ...): Promise<ActionResult<Loan>>
export async function updateLoan(id: string, data: ...): Promise<ActionResult<Loan>>
export async function deleteLoan(id: string): Promise<ActionResult<void>>
  // Cascade: also deletes repayments (onDelete: Cascade in schema)
export async function createRepayment(data: Omit<LoanRepayment,"id"|"createdAt"|"updatedAt">): Promise<ActionResult<LoanRepayment>>
```

### `lib/actions/meals.ts`

```ts
"use server"
export async function getRecipes(): Promise<Recipe[]>  // unscoped — all recipes
export async function upsertRecipe(data: Recipe): Promise<ActionResult<Recipe>>  // create or update by id
export async function deleteRecipe(id: string): Promise<ActionResult<void>>

export async function getWeeklyPlan(groupId: string, eventId?: string): Promise<DayMeals[]>
export async function upsertMealSlot(groupId: string, eventId: string|null, day: string, mealKey: "breakfast"|"lunch"|"dinner", recipeId: string): Promise<ActionResult<DayMeals>>
export async function deleteMealSlot(groupId: string, eventId: string|null, day: string, mealKey: "breakfast"|"lunch"|"dinner"): Promise<ActionResult<void>>
  // If all 3 slots become empty after deletion, deletes the DayMeals row
```

**`DayMeals` upsert handling** (null eventId issue):
```ts
// Prisma unique constraint: @@unique([groupId, eventId, day])
// eventId can be null — use raw where with AND to handle null correctly
const existing = await prisma.dayMeals.findFirst({
  where: { groupId, day, eventId: eventId ?? null }
})
```
Use `findFirst` + conditional `create`/`update` instead of `upsert` to avoid null composite key issues.

---

## Phase 4 — Wire Components

### 4a. `QueryClientProvider` setup

Create `components/providers/ReactQueryProvider.tsx`:
```tsx
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } }
  }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

Add to `app/layout.tsx` wrapping children inside `AuthProvider`.

### 4b. `GroupProvider` rewrite

Remove all localStorage group storage. New approach:

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getGroups, createGroup, updateGroup, deleteGroup } from "@/lib/actions/groups"
import { getEvents } from "@/lib/actions/events"  // or include in getGroups response

const { data: allGroups = [] } = useQuery({
  queryKey: ["groups", userId],
  queryFn: () => getGroups(userId),
  enabled: !!userId,
})

const { data: allEvents = [] } = useQuery({
  queryKey: ["events", userId],
  queryFn: () => getAllEventsForUser(userId),  // fetches events for all user groups
  enabled: !!userId,
})
```

`activeGroupId` + `activeEventId` remain in `localStorage` (only IDs, not data).

`addGroup`, `updateGroup`, `removeGroup` become server action calls + `queryClient.invalidateQueries({ queryKey: ["groups"] })`.

Keep the `buildDefaultGroup` logic: if `allGroups.length === 0` after query, create a default via `createGroup` server action.

### 4c. Section components — standard pattern

**Before:**
```tsx
import { tasks } from "@/lib/dummy-data"
const [items, setItems] = useState(tasks.filter(...))
useEffect(() => { setItems(tasks.filter(...)) }, [activeGroup.id])
function handleDelete(id) { setItems(prev => prev.filter(i => i.id !== id)) }
```

**After:**
```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/actions/tasks"

const qc = useQueryClient()
const queryKey = ["tasks", activeGroup.id, activeEvent?.id ?? null]

const { data: items = [] } = useQuery({
  queryKey,
  queryFn: () => getTasks(activeGroup.id, activeEvent?.id),
})

const deleteMutation = useMutation({
  mutationFn: deleteTask,
  onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
})

function handleDelete(id: string) {
  deleteMutation.mutate(id)
}
```

Create/update mutations follow the same pattern. Form state (`editingId`, `deleteId`) stays as local `useState` — no change.

### 4d. Components to wire (all follow the pattern above)

| Component | Action file | Query key prefix |
|-----------|-------------|-----------------|
| `TasksSection` | `tasks.ts` | `"tasks"` |
| `ShoppingSection` | `shopping.ts` | `"shopping"` |
| `NotesSection` | `notes.ts` | `"notes"` |
| `CalendarSection` | `calendar.ts` | `"calendar"` |
| `BudgetList` (in FinanceSection) | `finance.ts` | `"budgets"` |
| `ExpenseList` (in FinanceSection) | `finance.ts` | `"expenses"` |
| `IncomeList` (in FinanceSection) | `finance.ts` | `"incomes"` |
| `LoansSection` | `finance.ts` | `"loans"` |
| `MealsSection` | `meals.ts` | `"meals"`, `"recipes"` |
| `GroupsManager` | `groups.ts` | (via GroupProvider) |
| `EventsManager` | `events.ts` | `"events"` |

### 4e. Dashboard widgets

Dashboard widgets (`BudgetTracker`, `StatsCards`, `RecentTransactions`, etc.) currently import static arrays directly. After wiring they call `useQuery` with the active group. Dashboard RSC page passes `activeGroupId` from cookies as initial prop — or widgets use `useGroup()` to get it and fetch independently.

Derived stats (`balance`, `income`, `expenses`) are computed from real expense/income data in the server action or in the component.

### 4f. Admin panel

- `AdminUsersPage` and `AdminOverviewPage`: replace `getRegisteredUsers()` + `SEED_USER` with `useQuery({ queryFn: getUsers })`
- `AdminDataPage`: replace localStorage-based group counts with real Prisma counts per model

### 4g. GlobalSearch

Replace dummy data imports with a `search(query, groupId)` server action that queries all models concurrently via `Promise.all` and returns typed `SearchResult[]`.

---

## Phase 5 — Clean Up

### 5a. `lib/types.ts` (new file)

Move all type definitions from `lib/dummy-data.ts`:
`Group`, `AppEvent`, `Transaction`, `Task`, `ShoppingItem`, `Budget`, `BudgetCategory`, `Expense`, `Income`, `Loan`, `LoanRepayment`, `Note`, `CalendarEvent`, `Recipe`, `DayMeals`, `UserProfile`

Remove: data arrays, `stats`, `spendingByCategory`, `monthlyTrend`, `userProfile`.

### 5b. Update all imports

`from "@/lib/dummy-data"` → `from "@/lib/types"` (for types)
`from "@/lib/dummy-users"` — keep for `SessionPayload`, `UserRole`, `UserStatus`, `encodeSession`, `decodeSession`

### 5c. `lib/dummy-data.ts` after clean up

Keep the file but with types only and a comment:
```ts
// Types only — all data is now in the database.
// Seed data is in prisma/seed.ts
export * from "@/lib/types"  // re-export for backwards compat during transition
```

Or delete entirely if all imports have been updated.

### 5d. Update `CLAUDE.md`

Remove "UI-first with dummy data" note — app is now DB-backed.

---

## Files to Create

| File | Purpose |
|------|---------|
| `prisma/seed.ts` | Seed all dummy data to DB |
| `lib/types.ts` | App-level type definitions (moved from dummy-data.ts) |
| `lib/actions/auth.ts` | User auth + admin user management |
| `lib/actions/groups.ts` | Group CRUD |
| `lib/actions/events.ts` | Event CRUD |
| `lib/actions/tasks.ts` | Task CRUD |
| `lib/actions/shopping.ts` | ShoppingItem CRUD |
| `lib/actions/notes.ts` | Note CRUD |
| `lib/actions/calendar.ts` | CalendarEvent CRUD |
| `lib/actions/finance.ts` | Budget + Expense + Income + Loan + Repayment CRUD |
| `lib/actions/meals.ts` | Recipe + WeeklyPlan CRUD |
| `components/providers/ReactQueryProvider.tsx` | TanStack Query client setup |

## Files to Modify (major)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `User.status` |
| `package.json` | Add `@tanstack/react-query`, prisma seed config |
| `lib/dummy-users.ts` | Remove all localStorage functions, keep session utils |
| `lib/utils.ts` | Add `toDateStr()` helper |
| `app/layout.tsx` | Add `ReactQueryProvider` |
| `components/providers/AuthProvider.tsx` | Remove `findUserByEmail` import |
| `components/providers/GroupProvider.tsx` | Replace localStorage with TanStack Query + server actions |
| `app/login/page.tsx` | Use `loginAction` |
| `app/register/page.tsx` | Use `registerAction` |
| All 9 Section/List components | TanStack Query pattern |
| Dashboard widgets (9) | TanStack Query pattern |
| Admin pages (4) | Use `getUsers` action |
| Settings pages (2) | Use group/event actions |
| `components/layout/GlobalSearch.tsx` | Use search server action |

---

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|---------------|
| `prisma db seed` populates DB | `prisma/seed.ts` |
| Login/register/approval → Postgres | `lib/actions/auth.ts` |
| All CRUD persists | Server actions per domain |
| Page refresh doesn't reset data | TanStack Query cache + DB |
| GroupProvider loads from DB | Phase 4b |
| Admin panel shows real users | `getUsers()` action |
| No TypeScript errors | tsc --noEmit check at end |
