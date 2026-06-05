# Tasks

Tasks are action items within a group, optionally attached to an event.

**`Task` type:**
```ts
type Task = {
  id: string
  title: string
  category: string
  priority: "high" | "medium" | "low"
  done: boolean
  due: string        // YYYY-MM-DD
  icon: string       // emoji, auto-assigned from category
  groupId: string
  eventId?: string
}
```

**Category list (canonical):**
Chores · Bills · Shopping · Maintenance · Health · Personal · Work · Other

**Category → icon map:**
Chores → 🧹 · Bills → 💳 · Shopping → 🛒 · Maintenance → 🔧 · Health → 💊 · Personal → 👤 · Work → 💼 · Other → 📌

**Creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Title | string | Free text, required |
| Category | select | From canonical list |
| Priority | select | high \| medium \| low |
| Due date | date | Defaults to today |
| Event | select | Optional — only shown when group has events |

**Display rules:**
- Priority badge colours: high → `bg-destructive/10 text-destructive`, medium → `bg-warning/10 text-warning`, low → `bg-success/10 text-success`
- Done tasks show title with `line-through text-muted-foreground`
- All / Pending / Done filter tabs
- `dashboard/TaskList.tsx` accepts `onEdit` and `onDelete` callbacks — when provided, edit/delete actions appear on each row; when omitted renders read-only (dashboard usage)
- The add/edit form lives in `TasksSection.tsx`, which owns `useState<Task[]>` and passes the list + callbacks to `TaskList`

**Sort options:** Updated / Created / Due / Priority

**Edit/delete pattern:**
- `editingId: string | null` lives in `TasksSection` — `null` = create, set = edit (form pre-filled)
- `deleteId: string | null` lives in `TaskList` — inline "Delete? Yes / No" confirmation per row; confirmed calls `onDelete(id)` up to `TasksSection`
- Edit does not change `done` state — the done/undone toggle (`checked` Set) is local UI state in `TaskList` and is not reset on edit
- `onEdit` and `onDelete` props are optional — when omitted, `TaskList` renders read-only
