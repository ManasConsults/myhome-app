# Plan: Named Shopping Lists

**Created**: 2026-06-26 | **Effort**: ~4h | **Complexity**: Medium

---

## 1. Objective

**Goal**: Add a `ShoppingList` model so users can create named lists, add items to them, and optionally associate a list with an event.

**Why**: Currently all shopping items are a flat, undifferentiated pile. Named lists let users organize by purpose (e.g. "Weekly Groceries", "BBQ Party", "Europe Trip").

**Success**:
- User can create / rename / delete a named shopping list
- Items are created within a specific list (list picker in form)
- A list can optionally be tagged to an event; items in that list inherit the event
- Existing data (items without a list) is not lost or broken

---

## 2. Approach

### Data model

**New model `ShoppingList`:**
```
id, name, groupId → Group, eventId? → AppEvent,
createdBy? → User, items ShoppingItem[], timestamps
```

**`ShoppingItem` change:** add optional `listId String?` FK → `ShoppingList` (onDelete: Cascade).  
Keep `eventId` on `ShoppingItem` — auto-set from list's `eventId` at create time. This preserves the shared-event query path (`getShoppingItemsByEvent` filters `{ where: { eventId } }` directly).

**`ShoppingList` type** (includes aggregated counts for summary cards):
```ts
type ShoppingList = {
  id, name, groupId, eventId?,
  createdBy?, itemCount, checkedCount,
  estimatedTotal, createdAt, updatedAt
}
```

### Auth
- List CRUD: `requireGroupOwner(groupId)` — same as other group-scoped data
- Items in a list with `eventId`: `requireEventMember(eventId)` on create (same as today)

### UI architecture

**`ShoppingSection`** (redesigned):
- Owns list-level CRUD state: `showListForm`, `editingListId`, list query
- Stats bar now aggregates across all lists in scope (counts from `ShoppingList` summaries)
- EventFilter / SharedEventBanner unchanged
- Renders one `ShoppingListCard` per list + "New list" form (collapsed by default)

**New `ShoppingListCard` component** (holds item-level state):
- Header row: list name · event badge · "X/Y collected" progress chip · estimated total · edit/delete/expand actions
- Expanded: items via `ShoppingList` (existing display component, pass `listId`-filtered items) + "Add item" inline form
- Item form: same fields as today minus the event selector (event comes from the list)

**`components/dashboard/ShoppingList.tsx`** — unchanged (reads all group items flat; no list concept on dashboard).

### Trade-offs

| Decision | Choice | Rationale |
|---|---|---|
| `listId` on item | `String?` (optional) | Existing items keep `listId = null`; no data migration needed |
| `eventId` on item | Keep, auto-set from list | Preserves shared-event query compat without joins |
| Item form location | Inside `ShoppingListCard` | Each list has its own add-item form; single-form-per-section pattern doesn't scale to multiple lists |
| List delete | CASCADE to items | Orphan items with no list are useless under the new model |

---

## 3. Tasks

**Phase 1 — Schema, migration, types, actions** (~1.5h)

1. **Schema** (15min) — add `ShoppingList` model + `listId` on `ShoppingItem`; add relations on `Group`, `AppEvent`, `User` | Deps: none | Risk: L
2. **Migration** (10min) — `npx prisma migrate dev --name add_shopping_lists`; verify `prisma generate` succeeds | Deps: 1 | Risk: L
3. **`lib/types.ts`** (10min) — add `ShoppingList` type with computed counts | Deps: 1 | Risk: L
4. **`lib/actions/shopping-lists.ts`** (30min) — `getShoppingLists(groupId, eventId?)`, `createShoppingList`, `updateShoppingList`, `deleteShoppingList`; each uses `requireGroupOwner`; `getShoppingLists` uses `_count` + `_sum` aggregation for `itemCount`, `checkedCount`, `estimatedTotal` | Deps: 2, 3 | Risk: M (Prisma aggregation syntax)
5. **Update `lib/actions/shopping.ts`** (20min) — add `getShoppingItemsByList(listId)` action; update `createShoppingItem` to accept optional `listId`, look up list to auto-set `groupId`/`eventId` | Deps: 2 | Risk: L

**Phase 2 — UI** (~2.5h)

6. **`ShoppingListCard` component** (60min) — new `components/shopping/ShoppingListCard.tsx`; accordion expand/collapse; item list (passes data to existing `ShoppingList`); inline add/edit item form (no event selector); list edit inline with Pencil/Trash | Deps: 4, 5 | Risk: M (Framer Motion accordion + nested form state)
7. **Redesign `ShoppingSection`** (50min) — list query + list CRUD form (name + optional event select); stats bar aggregates from list summaries; render `ShoppingListCard` per list; empty state ("No lists yet. Create one to get started.") | Deps: 6 | Risk: L
8. **Update `components/shopping/CLAUDE.md`** (10min) — document new `ShoppingList` type, two-level UI pattern | Deps: 7 | Risk: L

**Total: ~4h**

---

## 4. Quality Strategy

- **Type-check**: `npx tsc --noEmit` after each phase — catches action signature mismatches early
- **Manual test path**: create list → add item → check item off → create event-linked list → verify item inherits `eventId` → delete list → verify items deleted
- **Edge cases**: empty list (no items), list with event but no group events (doesn't crash), shared event context (items still appear under `getShoppingItemsByEvent`)
- **Dashboard widget**: verify `ShoppingList` on dashboard still shows items correctly (no `onEdit`/`onDelete` props = read-only mode)

---

## 5. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Prisma `_count` + `_sum` in one query breaks | M | Test query in isolation first; fall back to separate count query if needed |
| Framer Motion accordion conflicts with item form expand | M | Use distinct `AnimatePresence` keys per list card |
| Shared-event item creation breaks (listId + eventId path) | H | Test this path explicitly; auth guard logic unchanged |

**Assumptions**:
- Existing items with `listId = null` will remain in the DB but won't appear in the new UI (acceptable — user's existing data is minimal/test data)
- Dashboard widget stays read-only flat view (no list grouping on dashboard)

**Out of scope**:
- Moving items between lists
- Reordering lists
- List-level checked/clear-all action
- Dashboard widget showing list names
