# Feature Design: Reference Data Admin

**Date:** 2026-06-05
**Status:** DRAFT
**Feature slug:** reference-data-admin

---

## Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/settings/reference-data` | `app/(dashboard)/settings/reference-data/page.tsx` | Admin only |

`proxy.ts` — add `/settings/reference-data` to the existing `/admin` guard block:
```ts
if (pathname.startsWith("/admin") || pathname === "/settings/reference-data") {
  if (!session) return NextResponse.redirect(new URL("/login", req.url))
  if (session.user.role !== "admin") return NextResponse.redirect(new URL("/", req.url))
  return NextResponse.next()
}
```

---

## Database

### New model — `prisma/schema.prisma`

```prisma
model Category {
  id        String   @id @default(cuid())
  domain    String   // see CategoryDomain below
  name      String
  icon      String   @default("")   // emoji; empty for notes and meal_tag
  color     String   @default("")   // calendar only: "primary" | "success" | "warning" | "destructive" | "muted"
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([domain, name])
  @@index([domain, sortOrder])
}
```

### TypeScript types — `lib/types.ts` additions

```ts
export type CategoryDomain =
  | "expense"    // Finance — expense & budget forms (shared)
  | "income"     // Finance — income form
  | "task"       // Tasks form
  | "shopping"   // Shopping form
  | "note"       // Notes form
  | "calendar"   // Calendar form
  | "meal_tag"   // Recipe tags

export type Category = {
  id: string
  domain: CategoryDomain
  name: string
  icon: string   // emoji string; "" when domain has no icon
  color: string  // calendar dot-color token; "" for all other domains
  sortOrder: number
}
```

### `CalendarEvent.category` type change

Current: `"appointment" | "birthday" | "holiday" | "reminder" | "social"` (TypeScript union).
After: `string` — the Prisma column is already `String`; only the TS type needs relaxing in `lib/types.ts` and `CalendarSection.tsx`.

Dot-color lookup in `CalendarGrid` currently uses a hardcoded `Record<CalendarEvent["category"], string>`. After this change it derives the color from the passed `calendarCategories: Category[]` list by matching `name`.

---

## Seed data — `prisma/seed.ts`

Add a seeding block that `upsert`s all defaults so re-running seed is idempotent.

| Domain | Names | Icon |
|--------|-------|------|
| expense | Food & Dining · Utilities · Entertainment · Health & Fitness · Shopping · Transportation · Housing · Education · Travel · Personal Care | 🍽️ ⚡ 🎭 💪 🛍️ 🚗 🏠 📚 ✈️ 💆 |
| income | Salary · Freelance · Rental Income · Investment · Business Income · Government Benefits · Gift · Other | 💼 💻 🏠 📈 🏢 🏛️ 🎁 💰 |
| task | Chores · Bills · Shopping · Maintenance · Health · Personal · Work · Other | 🧹 💳 🛒 🔧 💊 👤 💼 📌 |
| shopping | Produce · Dairy · Meat · Bakery · Frozen · Drinks · Snacks · Cleaning · Personal Care · Other | 🥦 🥛 🥩 🍞 🧊 🧃 🍿 🧹 🧴 🛍️ |
| note | General · Home · Finance · Health · Work · Personal · Shopping · Travel · Other | (empty) |
| calendar | appointment · birthday · holiday · reminder · social | 📅 🎂 🏖️ ⏰ 🎉 (colors: primary · success · success · warning · muted) |
| meal_tag | Vegetarian · Vegan · Gluten-Free · Quick · High-Protein · Budget-Friendly · Family · Meal-Prep | (empty) |

`sortOrder` is set to the index of each item in the list above (0-based).

---

## Server Actions — `lib/actions/categories.ts`

```ts
// Read (no auth guard — all authenticated users need categories for forms)
getCategories(domain: CategoryDomain): Promise<Category[]>
// Sorted by sortOrder ASC. Called from page RSCs.

// Admin-only mutations — all call requireAdmin() at the top
createCategory(domain: CategoryDomain, data: { name: string; icon: string; color: string }): Promise<{ success: boolean; data?: Category; error?: string }>

updateCategory(id: string, data: { name: string; icon: string; color: string }): Promise<{ success: boolean; error?: string }>

deleteCategory(id: string): Promise<{ success: boolean; usageCount?: number; error?: string }>
// Counts usage across the relevant domain's tables before deleting.
// Returns { success: false, usageCount: N } when N > 0 — caller shows the warning.

reorderCategory(id: string, direction: "up" | "down"): Promise<{ success: boolean }>
// Swaps sortOrder with the adjacent item in the same domain.
```

### Usage count query per domain

| Domain | Count query |
|--------|-------------|
| expense | `prisma.expense.count({ where: { category: name } }) + prisma.budget.count(...)` |
| income | `prisma.income.count({ where: { category: name } })` |
| task | `prisma.task.count({ where: { category: name } })` |
| shopping | `prisma.shoppingItem.count({ where: { category: name } })` |
| note | `prisma.note.count({ where: { category: name } })` |
| calendar | `prisma.calendarEvent.count({ where: { category: name } })` |
| meal_tag | `prisma.recipe.count({ where: { tags: { has: name } } })` |

---

## Validation — `lib/validations/category.ts`

```ts
export const createCategorySchema = z.object({
  domain: z.enum(["expense","income","task","shopping","note","calendar","meal_tag"]),
  name: z.string().min(1).max(50),
  icon: z.string().max(4).default(""),   // single emoji or empty
  color: z.string().max(20).default(""), // token name or empty
})
export const updateCategorySchema = createCategorySchema.omit({ domain: true })
```

---

## Component Tree

```
app/(dashboard)/settings/reference-data/page.tsx   [RSC — admin only]
  └── <Header title="Reference Data" />
  └── <ReferenceDataManager initialData={categoriesByDomain} />

components/settings/ReferenceDataManager.tsx        ["use client"]
  ├── Tab bar (7 tabs)
  └── <CategoryTab domain={...} items={...} />      [inline, not a separate file]
        ├── Add form (AnimatePresence slide-in)
        └── Category list rows (sortOrder sorted)
              ├── Name + icon badge
              ├── ▲ / ▼ reorder buttons
              ├── Edit button → inline edit form
              └── Delete button → inline "Used by N items" or "Delete? Yes / No"
```

### `ReferenceDataManager` props

```ts
type CategoriesByDomain = Record<CategoryDomain, Category[]>

type ReferenceDataManagerProps = {
  initialData: CategoriesByDomain
}
```

Page RSC fetches all 7 domains in one `Promise.all` and passes as `initialData`. The component uses TanStack Query with this as `initialData` — mutations invalidate the relevant domain's query key.

### Tab labels and icons (Lucide)

| Domain key | Tab label | Icon |
|------------|-----------|------|
| expense | Expense | `Receipt` |
| income | Income | `Banknote` |
| task | Tasks | `CheckSquare` |
| shopping | Shopping | `ShoppingCart` |
| note | Notes | `StickyNote` |
| calendar | Calendar | `CalendarDays` |
| meal_tag | Recipe Tags | `UtensilsCrossed` |

### Add / Edit form fields per domain

| Domain | Name | Icon field | Color field |
|--------|------|------------|-------------|
| expense | ✓ | ✓ emoji text input | — |
| income | ✓ | ✓ emoji text input | — |
| task | ✓ | ✓ emoji text input | — |
| shopping | ✓ | ✓ emoji text input | — |
| note | ✓ | — | — |
| calendar | ✓ | ✓ emoji text input | ✓ token select (4 options) |
| meal_tag | ✓ | — | — |

Calendar color select options: Primary · Success · Warning · Destructive · Muted (maps to semantic tokens).

### Delete flow

1. Click delete (Trash2 icon) → calls `deleteCategory(id)` via mutation
2. If `usageCount > 0` → row shows inline: `"Used by {N} items — remove them first"` (no Yes/No)
3. If `usageCount === 0` → row shows inline: `"Delete? "` + `[Yes]` `[No]`
4. Confirm → deletes, row animates out

---

## Navigation — admin-only sub-item

**`components/layout/Sidebar.tsx`** — `bottomItems` becomes dynamic. Since Sidebar is already `"use client"` and imports `usePathname()`, add `useAuth()` and build the settings sub-items conditionally:

```ts
import { useAuth } from "@/components/providers/AuthProvider"
import { Database } from "lucide-react"

// inside Sidebar():
const { user } = useAuth()

const bottomItems: NavItem[] = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    subItems: [
      { href: "/settings/profile", label: "Profile", icon: User },
      { href: "/settings/groups", label: "Groups", icon: Home },
      { href: "/settings/events", label: "Events", icon: CalendarDays },
      ...(user?.role === "admin"
        ? [{ href: "/settings/reference-data", label: "Reference Data", icon: Database }]
        : []),
    ],
  },
]
```

Apply the same conditional to **`MobileNav.tsx`** — identical pattern.

---

## Feature form updates

Each feature page RSC fetches its category domain(s) alongside existing data and passes as props. Category names are passed as `string[]` (just the names, sorted) to keep component signatures simple — icon lookup is done inside the component using the existing `CATEGORY_ICONS` record pattern, now built from the fetched data.

### Pattern (same for all)

**Page RSC:**
```tsx
const [categories, ...otherData] = await Promise.all([
  getCategories("task"),
  // ...existing fetches
])
return <TasksSection categories={categories} ... />
```

**Section component prop added:**
```ts
type TasksSectionProps = {
  categories: Category[]
  // ...existing props
}
```

**Inside form (replaces hardcoded CATEGORIES array):**
```tsx
{categories.map((c) => (
  <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
))}
```

**Icon resolution (replaces hardcoded CATEGORY_ICONS record):**
```ts
const iconMap = Object.fromEntries(categories.map(c => [c.name, c.icon]))
// usage: iconMap[category] ?? "📌"
```

### Files modified per domain

| Domain | Page RSC | Component |
|--------|----------|-----------|
| expense | `app/(dashboard)/finance/expenses/page.tsx` | `components/finance/ExpenseList.tsx` |
| expense (shared) | `app/(dashboard)/finance/budgets/page.tsx` | `components/finance/BudgetList.tsx` |
| income | `app/(dashboard)/finance/income/page.tsx` | `components/finance/IncomeList.tsx` |
| task | `app/(dashboard)/tasks/page.tsx` | `components/tasks/TasksSection.tsx` |
| shopping | `app/(dashboard)/shopping/page.tsx` | `components/shopping/ShoppingSection.tsx` |
| note | `app/(dashboard)/notes/page.tsx` | `components/notes/NotesSection.tsx` |
| calendar | `app/(dashboard)/calendar/page.tsx` | `components/calendar/CalendarSection.tsx` + `CalendarGrid.tsx` |
| meal_tag | `app/(dashboard)/meals/page.tsx` | `components/meals/RecipeList.tsx` |

### Meals — recipe tags

`RecipeList` receives `suggestedTags: string[]` prop. The form still accepts free-form comma-separated input, but renders clickable tag chips below the input that toggle the tag on/off (adds/removes from the comma-separated string):

```tsx
{suggestedTags.map(tag => (
  <button key={tag}
    onClick={() => toggleTag(tag)}
    className={cn("px-2 py-0.5 rounded-full text-xs border", active ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground")}
  >{tag}</button>
))}
```

### Calendar — dot color lookup change

`CalendarGrid` currently has a hardcoded `DOT_COLORS` map keyed on the typed enum. After this change:
- `CalendarGrid` receives `categories: Category[]` prop
- Derives: `const dotColorMap = Object.fromEntries(categories.map(c => [c.name, c.color || "muted-foreground"]))`
- Renders dot: `bg-${dotColorMap[event.category] ?? "muted-foreground"}`

Wait — the color token is like `"primary"`, so the class is `bg-primary`. This needs to be a full class or use `cn()` with a lookup. Use a `COLOR_DOT_CLASSES` map:
```ts
const COLOR_DOT_CLASSES: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground",
}
// usage: COLOR_DOT_CLASSES[dotColorMap[event.category]] ?? "bg-muted-foreground"
```

---

## Files to create

| File | Purpose |
|------|---------|
| `lib/actions/categories.ts` | All category server actions |
| `lib/validations/category.ts` | Zod schemas |
| `app/(dashboard)/settings/reference-data/page.tsx` | Admin page RSC |
| `components/settings/ReferenceDataManager.tsx` | Main manager client component |

## Files to modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `Category` model |
| `prisma/seed.ts` | Seed all 7 domain defaults |
| `proxy.ts` | Add `/settings/reference-data` to admin guard |
| `lib/types.ts` | Add `Category`, `CategoryDomain`; relax `CalendarEvent.category` to `string` |
| `components/layout/Sidebar.tsx` | Admin-only Reference Data sub-item |
| `components/layout/MobileNav.tsx` | Same |
| `app/(dashboard)/finance/budgets/page.tsx` | Fetch expense categories |
| `app/(dashboard)/finance/expenses/page.tsx` | Fetch expense categories |
| `app/(dashboard)/finance/income/page.tsx` | Fetch income categories |
| `app/(dashboard)/tasks/page.tsx` | Fetch task categories |
| `app/(dashboard)/shopping/page.tsx` | Fetch shopping categories |
| `app/(dashboard)/notes/page.tsx` | Fetch note categories |
| `app/(dashboard)/calendar/page.tsx` | Fetch calendar categories |
| `app/(dashboard)/meals/page.tsx` | Fetch meal_tag categories |
| `components/finance/BudgetList.tsx` | Accept + use `expenseCategories: Category[]` prop |
| `components/finance/ExpenseList.tsx` | Accept + use `expenseCategories: Category[]` prop |
| `components/finance/IncomeList.tsx` | Accept + use `incomeCategories: Category[]` prop |
| `components/tasks/TasksSection.tsx` | Accept + use `categories: Category[]` prop |
| `components/shopping/ShoppingSection.tsx` | Accept + use `categories: Category[]` prop |
| `components/notes/NotesSection.tsx` | Accept + use `categories: Category[]` prop |
| `components/calendar/CalendarSection.tsx` | Accept + use `categories: Category[]` prop |
| `components/calendar/CalendarGrid.tsx` | Accept + use `categories: Category[]` for dot color |
| `components/meals/RecipeList.tsx` | Accept + use `suggestedTags: string[]` prop |
| `components/settings/CLAUDE.md` | Document ReferenceDataManager |
