# Settings — Groups, Events, Profile

## Groups

Groups are **households** — permanent locations a user manages. Every data type carries `groupId: string`.

**`Group` type:**
```ts
type Group = {
  id: string
  name: string
  type: "household"                    // always
  currency: string                     // ISO 4217 e.g. "AUD", "USD", "INR"
  description?: string
  location?: string
  color: "primary" | "success" | "destructive" | "warning"
  icon: string
  isDefault?: boolean
  userId: string
}
```

**Canonical dummy groups:**
| id | name | location | color |
|----|------|----------|-------|
| g1 | My Home | Brisbane | primary |
| g2 | Mum's House | Sydney | success |

**Sort options (GroupsManager):** Name / Location

**Edit/delete pattern (`GroupsManager`):**
- `editingId: string | null` — `null` = create, set = edit (form pre-filled)
- `deleteId: string | null` — inline "Delete? Yes / No" per row; confirmed calls `handleDelete(id)`
- Edit button (Pencil) on all groups; delete button (Trash2) only on non-default groups
- `openEdit(g)` pre-fills the form and scrolls to it
- `handleSave` upserts: updates existing if `editingId` set, otherwise creates new
- Default group (`isDefault: true`) can be edited but not deleted

---

## Events

Events are **time-bound activities** (trips, weddings, renovations) belonging to a parent group. Event-scoped data is tracked separately from the household's regular data.

**`AppEvent` type:**
```ts
type AppEvent = {
  id: string
  groupId: string
  name: string
  description?: string
  icon: string
  color: "primary" | "success" | "destructive" | "warning"
  startDate: string                    // YYYY-MM-DD
  endDate?: string                     // YYYY-MM-DD
}
```

**Canonical dummy events:**
| id | groupId | name | color |
|----|---------|------|-------|
| ev1 | g1 | Wedding 2026 | destructive |
| ev2 | g1 | Europe Trip | warning |

**Sort options (EventsManager):** Start date / Name — within each household

**Edit/delete pattern (`EventsManager`):**
- `editingId: string | null` — `null` = create, set = edit
- `deleteId: string | null` — inline "Delete? Yes / No" per row
- `openEdit(ev)` pre-fills all fields (name, groupId, startDate, endDate, icon, color) and scrolls to form
- `handleSave` upserts: updates existing if `editingId` set, otherwise creates new
- Events displayed grouped by household; each row has Pencil + Trash2 action buttons

**Data items with `eventId`:**
All data types (`Budget`, `Expense`, `Income`, `Task`, `ShoppingItem`, `Note`, `CalendarEvent`, `DayMeals`) carry optional `eventId?: string`. `groupId` is always set even when `eventId` is present.

**Color system (`COLOR_MAP` in `ScopeSwitcher`/`GroupSwitcher`):**
| color value | bg | text | dot |
|---|---|---|---|
| `"primary"` | `bg-primary/10` | `text-primary` | `bg-primary` |
| `"success"` | `bg-success/10` | `text-success` | `bg-success` |
| `"destructive"` | `bg-destructive/10` | `text-destructive` | `bg-destructive` |
| `"warning"` | `bg-warning/10` | `text-warning` | `bg-warning` |

**`GroupSwitcher`** lives in `components/layout/GroupSwitcher.tsx` (may be named `ScopeSwitcher.tsx`). Shows **only groups (households)** — events are never listed here. Shows active group icon + name + location. Click-outside via `useRef` + `document.addEventListener("mousedown", ...)` in `useEffect`.

**Rules:**
- Every new data item assigned `groupId: activeGroup.id` (always)
- Event-scoped items also get `eventId: activeEvent.id`
- Never hard-code group or event IDs — always read from `useGroup()`

---

## Profile Page

Lives at `app/(dashboard)/settings/profile/page.tsx`.

**Fields:** name (text), email (email), currency (select from `CURRENCIES`), timezone (select from `TIMEZONES`).

**Behaviour:**
- Live avatar preview updates as user types name
- Save button shows "Changes saved" for 2s then resets
- Saving updates the cookie via `setUser()` from `useAuth()`

**Rules:**
- `"use client"` — no metadata export
- Initializes state from `useAuth().user`
- `getInitials(name)` defined locally: first letter of each word, max 2, uppercased
