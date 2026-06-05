# Feature Plan: Reference Data Admin

**Date:** 2026-06-05
**Status:** APPROVED
**Feature slug:** reference-data-admin

---

## Problem Statement

All category lists in the app — expense categories, task categories, shopping categories, notes categories, calendar categories, and recipe tags — are hardcoded as constants in component files. There is no way to customise them without a code change. An admin needs to be able to add, rename, reorder, and remove categories so the app fits their household's actual usage without developer involvement.

## Proposed Solution

Add a **Reference Data** admin-only section under Settings. It provides a tabbed UI, one tab per feature domain, where the admin can see all categories for that domain and add, edit, reorder, or delete them. Categories are stored in the database and seeded with the current hardcoded defaults on first migration. All feature forms that currently read from hardcoded arrays are updated to fetch live data from the database instead.

## Scope — Reference Data Types

| Domain | What is managed | Has icon | Notes |
|--------|----------------|----------|-------|
| Finance — Expense/Budget | Category name + icon | ✓ | Shared list used by both Budgets and Expenses |
| Finance — Income | Category name + icon | ✓ | Separate list from expense |
| Tasks | Category name + icon | ✓ | Icon auto-suggests from name |
| Shopping | Category name + icon | ✓ | Icon auto-suggests from name |
| Notes | Category name (no icon) | ✗ | Notes use note-level color, not category icon |
| Calendar | Category name + icon + dot color | ✓ | Dot color used in CalendarGrid; restricted palette |
| Meals — Recipe Tags | Tag name (no icon) | ✗ | Free-form tags on recipes; admin curates suggestions |

**Out of scope for v1:** shopping units, per-group overrides (categories are global/app-wide), category merging/migration tool.

## User Stories

- As an admin, I want to add a new expense category so I can track spending in a way that matches my household
- As an admin, I want to rename a default category so the label fits my terminology
- As an admin, I want to delete a category I never use so forms are less cluttered
- As an admin, I want to reorder categories so the most-used ones appear at the top
- As an admin, I want to set an icon for each category so it looks consistent across the app

## Acceptance Criteria

- [ ] Settings nav shows "Reference Data" sub-item, visible only to admin users
- [ ] Reference Data page has a tab per domain (7 tabs)
- [ ] Each tab lists all categories for that domain with their name, icon (if applicable), and sort order
- [ ] Admin can add a new category (name required; icon defaults to a sensible emoji)
- [ ] Admin can edit an existing category's name, icon (where applicable), and for calendar categories, the dot color
- [ ] Admin can delete a category — if the category is in use by existing records, show a warning count; deletion is still allowed
- [ ] Admin can reorder categories via drag-and-drop (order reflected in all feature forms)
- [ ] All feature forms (budget, expense, income, task, shopping item, note, calendar event, recipe) read categories from the database, not hardcoded arrays
- [ ] Database is seeded with all current hardcoded defaults so existing data remains consistent
- [ ] Non-admin users cannot access `/settings/reference-data` (redirected, not 404)
- [ ] Inline delete confirmation ("Delete? Yes / No") follows the existing settings pattern

## Out of Scope

- Per-group or per-user category overrides — categories are confirmed app-wide (global)
- Merging categories or bulk-reassigning existing records to a renamed category
- Shopping unit management (pcs, kg, L) — added later if needed
- Calendar dot-color as a full color picker — restricted to the 4 semantic tokens (primary, success, warning, destructive/muted)
- Import/export of category lists

## Data Model

Single `Category` table with a `domain` discriminator:

```prisma
model Category {
  id        String   @id @default(cuid())
  domain    String   // "expense" | "income" | "task" | "shopping" | "note" | "calendar" | "meal_tag"
  name      String
  icon      String   @default("")   // emoji; empty string for domains without icons
  color     String   @default("")   // calendar dot color token only; empty for others
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([domain, name])
}
```

Forms resolve categories with a server action: `getCategories(domain: string): Category[]`

## Navigation

Settings sub-nav gains a new item:
- Reference Data → `/settings/reference-data` — only rendered when `user.role === "admin"`

## Risks & Open Questions

- **In-use deletion:** Deletion is **blocked** when any existing record references that category. The action returns a usage count so the UI can display "Used by N items — remove them first."
- **Forms that are currently inline in Section components:** Each Section currently imports a hardcoded array. Category lists are lifted to the page RSC and passed down as props — consistent with existing patterns.
- **Reordering:** No `@dnd-kit/core` in `package.json` — will use ▲/▼ icon buttons per row. No new dependencies introduced.

## Complexity Estimate

- [x] Large — 3+ days
  - DB migration + seeding (all 7 domains × ~8 items = ~55 seed rows)
  - New settings page + 7-tab UI
  - Updates to 7+ feature forms to consume DB categories
  - Server actions: getCategories, createCategory, updateCategory, deleteCategory, reorderCategories
