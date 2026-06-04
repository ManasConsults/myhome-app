# Calendar

Scheduled items within a group, optionally attached to an event.

**`CalendarEvent` type:**
```ts
type CalendarEvent = {
  id: string
  title: string
  date: string       // YYYY-MM-DD
  time?: string      // HH:MM — omit for all-day
  category: "appointment" | "birthday" | "holiday" | "reminder" | "social"
  allDay: boolean
  icon: string       // emoji, auto-assigned from category
  groupId: string
  eventId?: string
}
```

**Category → icon map:**
appointment → 📅 · birthday → 🎂 · holiday → 🏖️ · reminder → ⏰ · social → 🎉

**Category → dot colour (CalendarGrid):**
appointment → `bg-primary` · reminder → `bg-warning` · birthday/holiday → `bg-success` · social → `bg-muted-foreground`

**Creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Title | string | Free text, required |
| Date | date | Required, defaults to today |
| Category | select | appointment \| birthday \| holiday \| reminder \| social |
| All day | toggle | Default on |
| Time | time | Only shown when all day is off |
| Event | select | Optional — only shown when group has events |

**Display rules:**
- `CalendarGrid` and `UpcomingEvents` are shared read-only widgets — never add forms to them
- The add form lives in `CalendarSection.tsx`, which owns `useState<CalendarEvent[]>` and passes the list to both `CalendarGrid` and `UpcomingEvents` via `data` prop

**Sort options (UpcomingEvents):** Date / Updated / Created
