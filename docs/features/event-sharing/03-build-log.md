# Feature Build Log: Event Sharing (Event Members)

**Date:** 2026-06-06
**Status:** COMPLETE
**Design:** [02-design.md](./02-design.md)

---

## Files Created

| File | Purpose |
|------|---------|
| `prisma/migrations/20260606000828_event_sharing/` | DB migration: EventMember table + createdBy columns |
| `lib/actions/event-members.ts` | addEventMember, removeEventMember, getEventMembers, getEventMemberCount |
| `components/settings/EventMembersPanel.tsx` | Members list + add-by-email form, rendered inside EventsManager card |
| `components/layout/SharedEventBanner.tsx` | Context banner replacing EventFilter when isSharedEvent |
| `docs/features/event-sharing/01-plan.md` | Feature plan |
| `docs/features/event-sharing/02-design.md` | Feature design |

## Files Modified

| File | What changed |
|------|-------------|
| `prisma/schema.prisma` | Added EventMember model; added createdBy/creator relation to 7 data models; added User back-relations |
| `lib/types.ts` | Added EventMember, SharedEvent types; added createdBy?: string to 7 data types |
| `lib/actions/_auth-guard.ts` | Added requireEventMember(eventId) — allows group owner or event member |
| `lib/actions/events.ts` | Added getSharedEventsByUser() returning SharedEvent[] |
| `lib/actions/finance.ts` | Added getByEvent reads (4); event-aware create (sets createdBy, derives groupId); event-aware delete (ownership check); requireLoanAccess helper for repayments/advances |
| `lib/actions/tasks.ts` | Added getTasksByEvent; event-aware create/delete |
| `lib/actions/shopping.ts` | Added getShoppingItemsByEvent; event-aware create/delete |
| `lib/actions/notes.ts` | Added getNotesByEvent; event-aware create/delete |
| `lib/actions/calendar.ts` | Added getCalendarEventsByEvent; event-aware create/delete |
| `lib/actions/meals.ts` | Added getMealPlanByEvent; event-aware upsert/delete |
| `components/providers/GroupProvider.tsx` | Added sharedEvents query; isSharedEvent, activeEventGroupId derived values; setActiveEvent handles shared events without switching activeGroup |
| `components/settings/EventsManager.tsx` | Added Members expand button + AnimatePresence panel per owned event; added Shared with me section; added useGroup import for setActiveEvent |
| `components/dashboard/TaskList.tsx` | Added canDelete?: (task) => boolean prop; gates delete button |
| `components/notes/NotesGrid.tsx` | Added canDelete?: (note) => boolean prop; gates delete button |
| `components/dashboard/ShoppingList.tsx` | Added canDelete?: (item) => boolean prop; gates delete button |
| `components/tasks/TasksSection.tsx` | Dual query path; SharedEventBanner; activeEventGroupId in create; ownership delete guard; canDelete prop |
| `components/shopping/ShoppingSection.tsx` | Same dual-path pattern |
| `components/notes/NotesSection.tsx` | Same dual-path pattern |
| `components/calendar/CalendarSection.tsx` | Same dual-path pattern (no delete UI) |
| `components/meals/MealsSection.tsx` | Same dual-path pattern (no ownership guard on DayMeals) |
| `components/finance/LoansSection.tsx` | Dual query path; event-aware create; ownership delete guard |
| `components/finance/ExpenseList.tsx` | Same full pattern + inline delete button visibility guard |
| `components/finance/IncomeList.tsx` | Same full pattern + inline delete button visibility guard |
| `components/finance/BudgetList.tsx` | Dual query path; activeEventGroupId in create (no delete guard — budgets owner-only) |
| `components/settings/CLAUDE.md` | Documented EventMember model, SharedEvent type, GroupProvider additions, section component pattern |

## TypeScript Check

```
npx tsc --noEmit → PASS (0 errors)
```

## Deviations from Design

- **Repayments/Advances auth:** Rather than per-repayment ownership, a `requireLoanAccess` helper was added that checks if the parent loan is event-scoped (uses `requireEventMember`) or group-scoped (uses `requireGroupOwner`). Any event member can add/delete repayments for any loan in the shared event — ownership not tracked at this sub-record level.
- **MealsSection delete ownership:** DayMeals is a shared weekly plan, not individual items. No createdBy guard added — any event member can update any day's meals. Consistent with its shared-plan semantics.
- **CalendarSection:** CalendarGrid is display-only (no onDelete prop). No delete ownership guard needed — event members can create calendar entries but cannot delete them through the UI (server still enforces the check).
- **BudgetList:** Budget create/delete remains owner-only (no `requireEventMember` path for creates). Guests can read shared event budgets via `getBudgetsByEvent` but cannot create new ones. This matches the intent that budgets are planning tools set by the household owner.
