# Shopping

Shopping is a two-level hierarchy: **ShoppingList** → **ShoppingItem**. The page shows named lists; items live inside a list.

---

## Types

**`ShoppingList` type:**
```ts
type ShoppingList = {
  id: string
  name: string
  groupId: string
  eventId?: string     // if set, all items in the list inherit this eventId
  createdBy?: string
  itemCount: number    // computed: total items in the list
  checkedCount: number // computed: checked items
  estimatedTotal: number
  createdAt: string
  updatedAt: string
}
```

**`ShoppingItem` type:**
```ts
type ShoppingItem = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string           // e.g. "pcs", "kg", "L"
  estimatedPrice: number
  checked: boolean
  store: string          // used for grouping in the item list view
  icon: string           // emoji, auto-assigned from category
  groupId: string
  eventId?: string       // auto-inherited from parent list's eventId on create
  listId?: string        // FK to ShoppingList; null for legacy items
  createdBy?: string
}
```

---

## Component structure

- **`ShoppingSection`** — owns list-level CRUD state, query, stats, list form
- **`ShoppingListCard`** — owns item-level CRUD state per list; accordion expand/collapse
- **`ShoppingList` (dashboard)** — read-only flat item display; unchanged

### ShoppingSection
- Queries `getShoppingLists(groupId, eventId?)` → list summaries with counts
- Stats bar aggregates across all lists: Total Items / Collected / Est. Total / Lists count
- List form: name (required) + optional event select (only shown when `!isSharedEvent && groupEvents.length > 0`)
- `editingId: string | null` — null = create, set = edit list
- `showForm: boolean` — create/edit form visibility

### ShoppingListCard
- Header always visible: expand chevron · list name · event badge (if eventId) · progress "X/Y collected" · estimated total · pencil + trash
- Delete confirmation: inline "Delete list? Yes / No" replaces action buttons
- Expanded: item list (sorted + grouped by store) + inline add/edit item form
- Item form has no event selector — event is on the list, inherited automatically
- `expanded: boolean`, `showItemForm: boolean`, `editingItemId: string | null` — all local state
- Item query: `getShoppingItemsByList(list.id)` — enabled only when `expanded`
- On item create/update: invalidates both `["shopping-list-items", list.id]` and `["shopping-lists"]`

---

## Auth pattern

- List CRUD: `requireGroupOwner(list.groupId)` — unless list has `eventId`, then `requireEventMember(list.eventId)` + creator check for update/delete
- Item create in list: auth derived from list's `eventId` (if set → `requireEventMember`; else → `requireGroupOwner`)
- Shared event: non-owner can create lists and items; can only delete own records (`createdBy === session.user.id`)

---

## Category list (canonical)

Produce · Dairy · Meat · Bakery · Frozen · Drinks · Snacks · Cleaning · Personal Care · Other

**Category → icon:** Produce → 🥦 · Dairy → 🥛 · Meat → 🥩 · Bakery → 🍞 · Frozen → 🧊 · Drinks → 🧃 · Snacks → 🍿 · Cleaning → 🧹 · Personal Care → 🧴 · Other → 🛍️

---

## Dashboard widget

`components/dashboard/ShoppingList.tsx` — unchanged. Fetches all items for `activeGroup.id` flat (no list concept), renders grouped by store. Used read-only with no `onEdit`/`onDelete` props.

---

## Key invariants

- Items always carry `groupId` even when in a list (denormalized for query compat)
- Items always carry `eventId` when their list has an event (auto-set by `createShoppingItem`)
- Deleting a list cascades to all its items (onDelete: Cascade in schema)
- Legacy items with `listId = null` exist in DB but are not shown in the new UI
- Checked state is local/session only — not persisted on toggle (only on edit save)
