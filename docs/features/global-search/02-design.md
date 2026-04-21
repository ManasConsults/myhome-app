# Feature Design: Global Search

**Date:** 2026-04-08
**Status:** APPROVED
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture

Single client component `GlobalSearch` that manages its own open/close state. Renders a trigger in the header and a portal-free overlay (absolute positioned, z-50) when open.

No new data — reads directly from all `lib/dummy-data.ts` exports. Filtering is synchronous client-side contains matching.

---

## Component Design

| Component | File | Notes |
|-----------|------|-------|
| `GlobalSearch` | `components/layout/GlobalSearch.tsx` | Self-contained — trigger + overlay |

### Header layout change

Current: `justify-between` with title left, actions right.
New: three regions — `[left]  [center: GlobalSearch]  [right]`

```
md+:  [hamburger(hidden) | title]  [🔍 Search... ⌘K]  [theme | bell | avatar]
mobile: [hamburger | title]                             [🔍 | theme | bell | avatar]
```

On mobile the search trigger is an icon button only; the overlay still works full-screen.

### Overlay

```
<AnimatePresence>
  {open && (
    // Backdrop (fixed inset-0 z-50, bg-black/50, backdrop-blur-sm)
    // Dialog (fixed top-[10%] left-1/2 -translate-x-1/2, w-full max-w-lg, z-50)
    //   → input row (🔍 icon + text input + Esc badge)
    //   → divider
    //   → results (scrollable max-h-[60vh])
    //        → empty: "Start typing to search…" / "No results for X"
    //        → grouped results
  )}
</AnimatePresence>
```

---

## Search Logic

```ts
type ResultType = "task" | "shopping" | "note" | "calendar" | "expense" | "income" | "budget" | "loan" | "recipe"

type SearchResult = {
  id: string
  type: ResultType
  title: string
  subtitle: string
  href: string
}
```

**Fields searched per type:**

| Type | Fields | Title | Subtitle | Href |
|------|--------|-------|----------|------|
| task | title, category | title | category · priority | `/tasks` |
| shopping | name, store, category | name | store · category | `/shopping` |
| note | title, content, category | title | category | `/notes` |
| calendar | title, category | title | date · category | `/calendar` |
| expense | title, category | title | `$amount` · category | `/finance/expenses` |
| income | title, category | title | `$amount` · category | `/finance/income` |
| budget | name, category | name | category · type | `/finance/budgets` |
| loan | contact, notes | contact | direction · `$principal` | `/finance/loans` |
| recipe | name, tags | name | mealType · `prepTime min` | `/meals` |

**Filtering:** all types with `groupId` are filtered by `activeGroup.id`. Recipes are always included.

**Limit:** max 4 results per group, results sorted by relevance (title match ranks above other field matches).

---

## Type Icons (Lucide)

| Type | Icon |
|------|------|
| task | `CheckSquare` |
| shopping | `ShoppingCart` |
| note | `StickyNote` |
| calendar | `CalendarDays` |
| expense | `Receipt` |
| income | `Banknote` |
| budget | `PiggyBank` |
| loan | `HandCoins` |
| recipe | `UtensilsCrossed` |

---

## Animations

- Backdrop: `opacity 0→1` (0.15s)
- Dialog: `opacity 0→1, scale 0.97→1` (0.15s ease-out)
- Result rows: no per-item animation (keeps it snappy)

---

## Files to Create

- `components/layout/GlobalSearch.tsx`

## Files to Modify

- `components/layout/Header.tsx` — restructure to 3-column, embed GlobalSearch
- `CLAUDE.md` — document global search pattern
