# Exploration: Shopping Lists Feature

**Date**: 2026-06-26 | **Scope**: Medium | **Status**: ✅ Complete

---

## 1. Foundation (What exists)

**Current shopping model**: Flat `ShoppingItem` records belonging to a `groupId` (+ optional `eventId`). The "Shopping List" label in the UI is just a card header — there is no list concept in the data.

**Files examined:**
- `prisma/schema.prisma` — `ShoppingItem` model (no list FK)
- `lib/types.ts` — `ShoppingItem` type, no `ShoppingList` type
- `lib/actions/shopping.ts` — CRUD for items, shared-event auth pattern
- `components/shopping/ShoppingSection.tsx` — Client section; holds form state, TanStack Query, passes data to `ShoppingList`
- `components/dashboard/ShoppingList.tsx` — Renders items sorted + grouped by `store`; also used read-only on dashboard
- `app/(dashboard)/shopping/page.tsx` — Thin RSC: fetches `categories`, renders `<Header>` + `<ShoppingSection>`

---

## 2. Current Data Model

```ts
ShoppingItem {
  id, name, category, quantity, unit,
  estimatedPrice, checked, store, icon,
  groupId, eventId?,        // event association at item level
  createdBy?, createdAt, updatedAt
}
```

No `ShoppingList` model exists anywhere in the schema, types, actions, or components.

---

## 3. Patterns to Follow

**Auth guard**: Every action calls `requireGroupOwner(groupId)` or `requireEventMember(eventId)`. For new list actions: `requireGroupOwner(list.groupId)`.

**Serialize helper**: Each action file has a local `serialize()` function that maps Prisma output to the app type. New list actions need their own.

**TanStack Query keys**: Items use `["shopping", groupId, eventId | null]`. Lists will need `["shopping-lists", groupId, eventId | null]`. Invalidating lists should also invalidate item queries since item counts are derived.

**Section component pattern** (from `NotesSection`, `ShoppingSection`):
- Section is `"use client"`, holds form + query state
- RSC page passes static props (categories)
- TanStack Query handles server state
- Form opens/closes with Framer Motion `height: 0 → auto`
- `editingId: string | null` controls create vs edit mode

**Inline delete confirmation**: `deleteId: string | null` per list (not per item within a list), "Delete? Yes No" replaces action buttons inline.

**Event association**: Currently at item level. New design moves it to **list level** — a list is either group-scoped or event-scoped. Items within the list inherit the list's eventId.

**Shared events**: `requireEventMember(eventId)` allows non-owners to read/write. The `createdBy` field enables "can this user delete?" checks. Lists in a shared event need the same pattern.

---

## 4. Key Constraints

- `listId` must be **optional** (`String?`) on `ShoppingItem` to avoid breaking existing data. The migration creates `ShoppingList` table; existing items get `listId = null`. The UI must handle items without a list gracefully (or run a data migration script separately).
- `components/dashboard/ShoppingList.tsx` is used **read-only** on the dashboard (no `onEdit`/`onDelete` props). The dashboard widget should remain unchanged — it renders the active group's flat item list.
- No new npm packages — everything needed (Framer Motion, TanStack Query, shadcn/ui primitives, Lucide) is already present.
- The stats bar currently aggregates all items in the group/event filter. With lists, stats should aggregate across all lists visible in the current scope.
- `eventId` **stays on `ShoppingItem`** for shared-event query compat (`getShoppingItemsByEvent` filters `{ where: { eventId } }`). When creating an item in an event-linked list, the action sets `eventId` from the list automatically.

---

## 5. What Needs to Change

### Schema (`prisma/schema.prisma`)
- Add `ShoppingList` model: `id, name, groupId, eventId?, createdBy?, items ShoppingItem[], timestamps`
- Add FK relations on `Group`, `AppEvent`, `User`
- Add `listId String?` + FK on `ShoppingItem` (cascade `SetNull` on list delete)

### Migration
- New migration creates `ShoppingList` table, adds `listId` column to `ShoppingItem`
- Existing items keep `listId = null` (no data migration needed)

### Types (`lib/types.ts`)
- Add `ShoppingList` type

### Actions
- New `lib/actions/shopping-lists.ts`: `getShoppingLists`, `createShoppingList`, `updateShoppingList`, `deleteShoppingList`
- Update `lib/actions/shopping.ts`: `createShoppingItem` receives `listId`, auto-sets `eventId` from list; `getShoppingItems` can filter by `listId`

### Components

**`ShoppingSection.tsx`** — full redesign:
- Two-level UI: list cards (accordion) → items within each expanded list
- State: `expandedListId: string | null`, list CRUD form (name, eventId?)
- Item form moves inside the expanded list (or a shared form with `listId` context)
- Stats now aggregate across all lists in scope

**`ShoppingList.tsx` (dashboard widget)** — unchanged; still fetches items by group, renders flat list

**New component `ShoppingListCard.tsx`** (or inline in `ShoppingSection`):
- Shows list name, event badge, item count, progress (X collected / Y total), estimated total
- Expand/collapse chevron; Pencil + Trash for list-level edit/delete
- When expanded: renders existing item list UI + "Add item" button

---

## 6. Handoff

**For PLAN**: The `listId` optional-vs-required decision is made: **optional** (null = legacy unassigned). UI treats null-listId items as a read-only "Legacy items" section or ignores them (since this is a redesign and existing data can be manually migrated). Event association moves to the list level. `createdBy` on the list enables shared-event list creation tracking.

**For CODE**:
- Run `npx prisma migrate dev --name add_shopping_lists` after schema changes
- Test runner: `npm run dev` + manual browser test
- Type check: `npx tsc --noEmit`

**Gaps / decisions needed**:
1. Should deleting a list also delete its items (CASCADE) or just unassign them (SET NULL)? → CASCADE is cleaner; items without a list are orphans anyway.
2. Can items be moved between lists? → Out of scope for now, not requested.
3. Dashboard `ShoppingList` widget: should it show list names as group headers instead of store names? → Keep as-is for now (no change to dashboard).
