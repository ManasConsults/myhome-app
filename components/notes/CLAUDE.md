# Notes

Freeform text entries within a group, optionally attached to an event.

**`Note` type:**
```ts
type Note = {
  id: string
  title: string
  content: string
  category: string
  pinned: boolean
  color: "default" | "blue" | "green" | "yellow" | "rose"
  updatedAt: string   // YYYY-MM-DD
  groupId: string
  eventId?: string
}
```

**Category list (canonical):**
General · Home · Finance · Health · Work · Personal · Shopping · Travel · Other

**Color → card style:**
- default → `bg-card border-border/60`
- blue → `bg-primary/5 border-primary/20`
- green → `bg-success/5 border-success/20`
- yellow → `bg-warning/5 border-warning/20`
- rose → `bg-destructive/5 border-destructive/20`

**Creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Title | string | Free text, required |
| Content | textarea | Free text, required |
| Category | select | From canonical list |
| Color | select/picker | default \| blue \| green \| yellow \| rose |
| Pinned | toggle | Default off |
| Event | select | Optional — only shown when group has events |

**Display rules:**
- Pinned notes sort first in the grid
- Grid is 1 col on mobile, 2 on sm, 3 on lg
- `NotesGrid` accepts optional `onEdit?: (note: Note) => void` and `onDelete?: (id: string) => void` — when omitted renders read-only (dashboard usage)
- `deleteId: string | null` lives in `NotesGrid`; `editingId: string | null` lives in `NotesSection`
- Delete confirmation replaces the right-side action area inline ("Delete? Yes No")
- Edit button hover uses `hover:bg-black/10 dark:hover:bg-white/10` (adapts to colored card backgrounds)
- `handleSave` on edit updates `updatedAt` to today's ISO date
- The add/edit form lives in `NotesSection.tsx`, which owns `useState<Note[]>` and passes list to `NotesGrid` via `data` prop

**Sort options:** Updated / Created / Title — pinned-first preserved
