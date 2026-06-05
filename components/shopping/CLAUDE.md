# Shopping

Shopping items are grouped by store in the list view. Each item can optionally be attached to an event.

**`ShoppingItem` type:**
```ts
type ShoppingItem = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string           // e.g. "pcs", "kg", "L"
  estimatedPrice: number // positive USD
  checked: boolean
  store: string          // used for grouping in the list view
  icon: string           // emoji, auto-assigned from category
  groupId: string
  eventId?: string
}
```

**Category list (canonical):**
Produce · Dairy · Meat · Bakery · Frozen · Drinks · Snacks · Cleaning · Personal Care · Other

**Category → icon map:**
Produce → 🥦 · Dairy → 🥛 · Meat → 🥩 · Bakery → 🍞 · Frozen → 🧊 · Drinks → 🧃 · Snacks → 🍿 · Cleaning → 🧹 · Personal Care → 🧴 · Other → 🛍️

**Creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Name | string | Free text, required |
| Category | select | From canonical list |
| Quantity | number | Default 1, min 0.01 |
| Unit | text | Default "pcs" |
| Est. price | number | USD, default 0 |
| Store | string | Required — used for grouping |
| Event | select | Optional — only shown when group has events |

**Display rules:**
- Items grouped by `store` in the list view
- Checked items show strikethrough name and muted price
- Stats: total items, collected count, estimated total cost, number of stores
- `dashboard/ShoppingList.tsx` accepts `onEdit` and `onDelete` callbacks — when provided, edit/delete actions appear on each row; when omitted renders read-only

**Sort options:** Updated / Created / Price / Name — applied before store grouping

**Edit/delete pattern:**
- `editingId: string | null` lives in `ShoppingSection` — `null` = create, set = edit (form pre-filled)
- `deleteId: string | null` lives in `ShoppingList` — inline "Delete? Yes / No" per row; confirmed calls `onDelete(id)` up to `ShoppingSection`
- Edit preserves `checked` state — the done/collected toggle is local UI state in `ShoppingList` keyed by item ID
- The add/edit form lives in `ShoppingSection.tsx`, which owns `useState<ShoppingItem[]>` and passes list + callbacks to `ShoppingList`
