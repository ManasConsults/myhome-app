@AGENTS.md

# MyHome — Project Context

A multi-user, multi-household home management app. Features: finance tracking, tasks, shopping, calendar, notes, meal planning. Mobile-first, deployed on Vercel. Solo developer.

## Current Phase

UI-first with dummy data. All data lives in `lib/dummy-data.ts`. Database (Prisma/local Postgres) schema is defined — **do not wire up real data unless explicitly asked**. Real Auth.js v5 is planned but not wired up yet.

Core UI pages exist for all features. Groups are implemented — all data types carry a `groupId` and the active group is managed by `GroupProvider`. Finance is feature-complete: budgets (with edit/delete), expense tracking, income (recurring + one-off), and loan tracking (lend/borrow, repayment history, interest). Global search is implemented in the header. Dummy auth is implemented (login/register/sign-out with cookie session). Active development: UI polish and future backend wiring.

### Dummy Auth

Cookie-based session auth is wired up for the UI phase:

- **Session cookie:** `myhome-session` = `btoa(JSON.stringify({ userId, name, email, role }))`. Not httpOnly — readable by both proxy.ts and client JS.
- **Route protection:** `proxy.ts` (project root) — Next.js 16 uses this directly (no `middleware.ts`). Public paths: `/login`, `/register`.
- **Dummy users:** `lib/dummy-users.ts` — `SEED_USER` (demo@myhome.app / demo1234, role: `"admin"`) always present; registered accounts stored in `localStorage["myhome-registered-users"]` with role: `"user"` by default.
- **Auth context:** `AuthProvider` in `components/providers/AuthProvider.tsx` wraps the root layout. `useAuth()` returns `{ user: SessionPayload | null, setUser, logout }`. `SessionPayload` includes `role`.
- **Roles:** `UserRole = "admin" | "manager" | "user"`. Seed user is `"admin"`. New registrations default to `"user"`. Role is stored in the session cookie and available via `useAuth().user.role`. Admin powers are reserved for future backend gating — no UI-phase restrictions yet.
- **Role pill:** shown next to the user's name in `ProfileDropdown` and `ProfilePage`. Colours — admin: `bg-primary/10 text-primary`, manager: `bg-warning/10 text-warning`, user: `bg-muted text-muted-foreground`. Labels — `"Admin"` / `"Manager"` / `"Member"`. Use `ROLE_PILL` constant (defined locally in each component) to keep the mapping consistent.
- **New users:** `GroupProvider` auto-creates a default "My Home" group for users with no groups, stored in `localStorage["myhome-user-groups-{userId}"]`.
- **Group ownership:** `Group` type has `userId: string`. All seed groups have `userId: "user-1"`. `GroupProvider` filters groups by current user's `userId`.
- **Profile page:** Initialises name/email from `useAuth().user`; saving updates the cookie via `setUser()`.
- **Sign out:** `ProfileDropdown` calls `useAuth().logout()` which clears the cookie and navigates to `/login`.

### Sort options

All list views have sort-by controls (Updated / Created / relevant domain fields) with asc/desc toggle:
- Finance: ExpenseList, IncomeList, BudgetList, LoanList (+ per-loan repayment sort)
- Tasks: TaskList (Updated / Created / Due / Priority)
- Shopping: ShoppingList (Updated / Created / Price / Name — applied before store grouping)
- Calendar: UpcomingEvents (Date / Updated / Created)
- Notes: NotesGrid (Updated / Created / Title — pinned-first preserved)
- Meals: RecipeList (Name / Prep / Calories — applied within each meal-type section)
- Settings: GroupsManager (Name / Location), EventsManager (Start date / Name — within each household)

All data types carry `createdAt: string` and `updatedAt: string` (YYYY-MM-DD).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (v16.2.1), App Router |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Motion | Framer Motion |
| Forms | React Hook Form + Zod |
| Client state | TanStack Query + React Context |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js v5 (NextAuth) |
| Email | Resend + React Email |
| Storage | Vercel Blob |
| Icons | Lucide React (exclusively) |
| Font | Plus Jakarta Sans — `next/font/google`, variable `--font-sans`, weights 300–800 |
| Dark mode | `next-themes` |
| Testing | Playwright |

---

## Next.js 16 — Key Rules

### RSC by Default
Use `"use client"` only when needed: hooks, event handlers, browser APIs. Never make a client component `async` — fetch data in a server parent and pass it down as props.

### Async APIs — Always Await
`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are all async. Type them as `Promise<...>` and await them:

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

### Caching — Use `'use cache'` Explicitly
`next.config.ts` has `cacheComponents: true`. Cache slow/shared data; never cache user-specific real-time data:

```tsx
async function HouseholdStats() {
  'use cache' // ✅ shared, infrequent-changing
  return await getStats()
}

async function CurrentBalance() {
  // No 'use cache' — must be fresh per request
  return await getBalance()
}
```

### proxy.ts (Next.js 16 — no middleware.ts)
Next.js 16 uses `proxy.ts` at the project root for route protection. Do **not** create `middleware.ts` — having both causes a build error. Export function name is `proxy`:

```tsx
export default function proxy(request: NextRequest) { ... }
```

### React Compiler
`reactCompiler: true` is enabled in `next.config.ts`. Do not add manual `useMemo`, `useCallback`, or `React.memo` — the compiler handles memoization automatically.

### Non-Serializable Props
Never pass `Date`, `Map`, `Set`, class instances, or plain functions from Server → Client components. Serialize dates to ISO strings. Only Server Actions (marked `'use server'`) may be passed as function props.

---

## Theme & Design System

### Color Tokens — Always Use These, Never Raw Tailwind
| Token | Use for |
|---|---|
| `text-primary` / `bg-primary` | Brand / accent |
| `text-destructive` | Errors, overspent, overdue, high priority |
| `text-success` | Income, completed, on-track |
| `text-warning` | Caution, near-limit, medium priority |
| `text-muted-foreground` | Secondary labels |
| `bg-muted` | Subtle backgrounds |

### Runtime Theme Color
oklch hue-based presets. `applyThemeColor()` in `lib/theme-colors.ts` sets CSS vars on `document.documentElement`. 8 presets, Indigo default (h=264). Requires `ThemeColorProvider` inside `ThemeProvider`. Persisted to `localStorage` as `myhome-color`. Use `resolvedTheme` from `next-themes` (not `theme`) to handle the `"system"` value.

---

## Component Conventions

- `size-*` shorthand — never `w-* h-*`
- `flex flex-col gap-*` — never `space-y-*`
- Icons inside `Button` — no size classes, use `data-icon` attribute
- Conditional classes — always `cn()`, never template literal ternaries
- Animations — Framer Motion only (`motion.*`, `variants`, `AnimatePresence`)

### Card elevation standard

All `Card` components have a built-in floating shadow and hover lift baked into `components/ui/card.tsx` — applies automatically everywhere. Do not override it.

- **Default:** soft floating shadow (`0 4px 12px`) — cards sit elevated above the page
- **Hover:** shadow expands (`0 12px 28px`) + card lifts `4px` upward (`-translate-y-1`), `transition-all duration-200`
- **Dark mode:** higher shadow opacity to stay visible against dark backgrounds
- Never add `shadow-none` or `hover:shadow-none` to a Card

### Floating UI standard

All shell chrome (header bar, sidebar, sidebar logo bar) floats off screen edges with rounded corners and shadow. Never let shell elements touch screen edges or use full-bleed styling.

#### Top header bar
```tsx
{/* Outer wrapper — sticky + float gap */}
<div className="sticky top-0 z-40 px-3 pt-3 pb-1">
  <header className="h-14 ... bg-background/90 backdrop-blur-sm rounded-2xl border border-border/60
    shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]
    dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">
  </header>
</div>
```

#### Sidebar
```tsx
<aside className="... h-[calc(100vh-1.5rem)] sticky top-3 m-3 bg-sidebar rounded-2xl overflow-hidden
  border border-sidebar-border/50
  shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.08)]
  dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.25)]">
```
- `m-3` floats it off all edges · `h-[calc(100vh-1.5rem)]` compensates for vertical margins · `sticky top-3` aligns with margin · `overflow-hidden` clips content to rounded corners · shadow is omnidirectional

#### Sidebar logo bar (inner floating header)
```tsx
<div className="px-3 pt-3 pb-1">
  <div className="h-14 ... bg-sidebar-accent/60 rounded-2xl border border-sidebar-border
    shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_4px_rgba(0,0,0,0.08)]
    dark:shadow-[0_4px_20px_rgba(0,0,0,0.45),0_1px_4px_rgba(0,0,0,0.25)]">
  </div>
</div>
```

#### Rules
- `rounded-2xl` on all floating chrome
- `border` all-round — never `border-b` or `border-r` only
- Shadow always has two layers: wide soft (`0 4-8px 20-32px`) + tight close (`0 1-2px 4-8px`)
- Dark mode shadow opacity: light `0.08–0.15` → dark `0.25–0.45`
- Images — always `next/image`, never `<img>`

---

## Design Principles

- Mobile-first — design for 375px, add `sm:` / `md:` / `lg:` only where layout genuinely changes
- Touch targets — minimum 44px on mobile
- All visual states — loading, empty, error, populated. Never leave these as TODO
- Accessibility — semantic HTML, keyboard navigation, ARIA where needed
- Motion — 200–400ms, ease-out, subtle transforms. Enhances, never distracts

---

## Data & State Patterns

- **Server Components** — fetch data directly (no useEffect, no TanStack Query)
- **Client Components** — use TanStack Query for server state that needs refresh/mutation
- **Mutations** — Server Actions only. Return `{ success: boolean, data?: T, error?: string }`
- **Avoid waterfalls** — use `Promise.all`, Suspense boundaries, or preload pattern
- **No Zustand / Jotai** — React Context for shared UI state, TanStack Query for server state

### Groups + Events — `GroupProvider` + `useGroup()`

The **active group** (household) is the primary scope — set from the sidebar GroupSwitcher. Within each feature page, the user can additionally filter by an **event** using an inline `EventFilter` bar. This event filter is a global state (so it persists as you move between sub-pages of a feature) but is always scoped to the active group's events.

```tsx
const { groups, events, activeGroup, activeEvent, setActiveGroup, setActiveEvent, clearActiveEvent } = useGroup()
```

- `activeGroup` — the active household. Switching group always clears `activeEvent`.
- `activeEvent` — the currently filtered event, or `null` (show all group data).
- `setActiveGroup(id)` — switches group, clears event. Persisted to `localStorage["myhome-active-group"]`.
- `setActiveEvent(id)` — sets the event filter. Persisted to `localStorage["myhome-active-event"]`.
- `clearActiveEvent()` — resets to showing all group data.
- Initialized from SSR defaults (`"g1"`, `null`); hydrated via `useEffect` to avoid hydration mismatch.
- Never read `localStorage` directly — always use `useGroup()`.

**Filtering logic in Section components:**
```tsx
const { activeGroup, activeEvent } = useGroup()

const filtered = activeEvent
  ? allItems.filter((i) => i.eventId === activeEvent.id)
  : allItems.filter((i) => i.groupId === activeGroup.id)  // includes event-tagged items
```

Note: when no event is filtered, the group view shows **all** items for the group — including event-tagged ones. This lets users see the full picture. The event filter narrows to just that event's items.

### Event selector in creation forms

All creation forms (expenses, income, budgets, and any future forms) must include an optional **Event** field when the active group has events.

**Pattern:**
```tsx
const { activeGroup, activeEvent, events } = useGroup()
const groupEvents = events.filter(e => e.groupId === activeGroup.id)

// form state — default to activeEvent if one is currently selected
const [eventId, setEventId] = useState(activeEvent?.id ?? "")

// in form JSX — only render when group has events:
{groupEvents.length > 0 && (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-muted-foreground font-medium">Event (optional)</label>
    <select value={eventId} onChange={e => setEventId(e.target.value)}
      className="h-9 px-3 rounded-lg border border-border bg-background text-sm ...">
      <option value="">No event</option>
      {groupEvents.map(ev => (
        <option key={ev.id} value={ev.id}>{ev.icon} {ev.name}</option>
      ))}
    </select>
  </div>
)}

// on submit — include eventId only when selected:
const newItem = {
  ...otherFields,
  groupId: activeGroup.id,
  ...(eventId ? { eventId } : {}),
}
```

**Rules:**
- When `groupEvents.length === 0`, do not render the Event field at all
- Default the select to `activeEvent?.id ?? ""` so if the user is viewing an event filter, the form pre-selects it
- `eventId` must be reset to `""` (or `activeEvent?.id ?? ""`) when the form is cleared after submit
- The Event field is always optional — "No event" is a valid choice

### EventFilter component

A shared inline filter bar rendered at the top of each feature Section. Shows the events belonging to the active group as pill buttons: **All** + one pill per event. Tapping a pill calls `setActiveEvent(id)`; tapping "All" calls `clearActiveEvent()`.

```tsx
// components/ui/EventFilter.tsx  (or components/shared/EventFilter.tsx)
// Props:
type EventFilterProps = {
  events: AppEvent[]          // only events for the active group
  activeEvent: AppEvent | null
  onSelect: (id: string | null) => void
}
```

- Active pill: `bg-primary text-primary-foreground`
- Inactive pill: `text-muted-foreground hover:text-foreground hover:bg-muted`
- Animate presence: pills animate in/out when group changes

### Section component pattern

Each feature has a `*Section` client component (e.g. `TasksSection`, `ShoppingSection`) that:
1. Calls `useGroup()` to get `activeGroup`, `activeEvent`, `setActiveEvent`, `clearActiveEvent`
2. Derives `groupEvents = events.filter(e => e.groupId === activeGroup.id)` for the EventFilter
3. Filters data using the scope filtering logic above
4. Renders `<EventFilter>` (when groupEvents.length > 0) then the list/grid component

Feature pages are thin RSC shells: `<Header />` + `<FeatureSection />`. All group/event logic lives in the Section component.

List components accept an optional `data?: T[]` prop; when provided it overrides the component's internal data import.

**When scope changes:** list components with local `useState` must reset on both `activeGroup.id` and `activeEvent?.id`:
```tsx
useEffect(() => {
  const next = activeEvent
    ? allItems.filter((i) => i.eventId === activeEvent.id)
    : allItems.filter((i) => i.groupId === activeGroup.id)
  setItems(next)
}, [activeGroup.id, activeEvent?.id])
```

---

## Project Structure

```
app/
  (dashboard)/          # Route group — authenticated dashboard
    layout.tsx          # Wraps children in <GroupProvider>
    page.tsx            # Home / overview
    finance/
      page.tsx            # Finance overview — summary cards + charts
      budgets/page.tsx    # Budget management
      expenses/page.tsx   # Expense tracking
      income/page.tsx     # Income tracking
    tasks/
    shopping/
    notes/
    calendar/
    meals/
    settings/
      page.tsx            # General settings (profile, appearance, preferences)
      groups/page.tsx     # Manage households
      events/page.tsx     # Manage events (linked to households)
  layout.tsx            # Root layout — ThemeProvider, ThemeColorProvider, fonts
  globals.css
components/
  calendar/             # CalendarGrid, UpcomingEvents, CalendarSection
  dashboard/            # Page-specific widgets (TaskList, ShoppingList, etc.)
  finance/              # BudgetList, ExpenseList, IncomeList, *Stats, FinanceSection
  layout/               # Shell: Header, Sidebar, MobileNav, GroupSwitcher (groups only)
  meals/                # WeeklyPlanGrid, RecipeList, MealsSection
  notes/                # NotesGrid, NotesSection
  providers/            # ThemeProvider, ThemeColorProvider, GroupProvider
  settings/             # Settings, GroupsManager, EventsManager
  shopping/             # ShoppingSection
  tasks/                # TasksSection
  ui/                   # shadcn/ui primitives (do not modify directly)
lib/
  dummy-data.ts         # All data while in UI-first phase (all types carry groupId)
  theme-colors.ts       # Color preset definitions + applyThemeColor()
  utils.ts              # cn() and shared utilities
  validations/          # Zod schemas (shared between forms + server actions)
  db/
    prisma.ts           # Prisma client singleton
proxy.ts                # Route protection (Next.js 16 — replaces middleware.ts)
```

---

## Environments & Deployment

| Env | Where | Branch |
|---|---|---|
| Development | Local (`npm run dev`) | any feature branch |
| Preview | Vercel (auto-deploy) | any PR / feature branch |
| Production | Vercel | `main` |

Self-hosting via Docker is also a target — keep `output: 'standalone'` in mind for `next.config.ts` when that phase begins.

---

## Navigation Conventions

### Sidebar sub-navigation
Features with sub-pages use an always-visible sub-nav group in the sidebar and MobileNav. The parent item links to the feature overview; sub-items link to the feature's sub-pages.

Sub-nav is defined in `components/layout/Sidebar.tsx` and `components/layout/MobileNav.tsx` via a `subItems` array on the parent `NavItem`. The parent item is active (layoutId pill) when `pathname === parent.href` exactly. Sub-items use a separate `layoutId="sidebar-sub-active"` so the Framer Motion pill animates independently between sub-pages. When on any sub-route, the parent item shows an "in-section" style (full opacity, `bg-sidebar-accent`) without the primary pill.

```ts
type SubItem = { href: string; label: string; icon: LucideIcon }
type NavItem  = { href: string; label: string; icon: LucideIcon; subItems?: SubItem[] }
```

Sub-items are indented and separated from the parent item with a left border: `ml-3 pl-3 border-l border-sidebar-border`.

**Collapse/expand toggle:**
- A `ChevronDown` button sits at the right edge of the parent item row. Clicking it toggles the sub-menu without navigating.
- Expanded state is stored in `localStorage` under key `myhome-nav-expanded` as `Record<string, boolean>` keyed by parent `href`.
- Initialized via `useEffect` after mount (never in `useState` initialiser) to avoid SSR hydration mismatch.
- Auto-expands if the user navigates directly to a sub-route while the parent is collapsed.
- Default state: all groups expanded (`true`).
- Sub-items animate in/out with Framer Motion height animation (`AnimatePresence initial={false}`, `height: 0 → "auto"`).
- The parent item row uses a flex split: `Link` (flex-1, navigates) + `button` (fixed width, toggles). The active pill uses `pointer-events-none` so both remain clickable beneath it.

**Finance sub-nav (canonical):**
- Finance → `/finance` (overview: summary cards + charts)
- Budgets → `/finance/budgets`
- Expenses → `/finance/expenses`
- Income → `/finance/income`

**Settings sub-nav (canonical):**
- Settings → `/settings` (general: profile, appearance, preferences)
- Profile → `/settings/profile` (edit name, email, currency, timezone)
- Groups → `/settings/groups` (manage households — create, edit, delete)
- Events → `/settings/events` (manage events — create, edit, delete, link to group)

Settings lives in `bottomItems` in the sidebar. `bottomItems` supports the same `renderNavItem` pattern as `navItems`, so Settings can have collapse/expand sub-items with the same animated pill.

---

## Branching & Workflow

Feature-based branches. One branch per feature or fix, merged to `main` via PR. Preview deployments on Vercel per branch. No long-lived branches other than `main`.

---

## Testing

Playwright for end-to-end tests. Test files live alongside the feature or in `e2e/`. No unit tests for now — add when backend logic warrants it.

---

## Feature Development Workflow

**Every new feature MUST go through the full workflow.** Do not start coding immediately.

```
Plan → Design → Build → Review → Deploy
```

When the user asks to build, create, implement, or add any non-trivial piece of functionality, follow the feature workflow before writing any code. The `/feature` command is followed **manually** (the Skill tool does not expose it) — write the plan doc, get approval, write the design doc, get approval, then build. The workflow produces five documents in `docs/features/{slug}/`:

| Stage | Document | Gate |
|-------|----------|------|
| 1. Plan | `01-plan.md` | User approves before design |
| 2. Design | `02-design.md` | User approves before build |
| 3. Build | `03-build-log.md` | User confirms before tests |
| 3b. Tests | `e2e/{slug}.spec.ts` | Auto — runs after build |
| 4. Review | `04-review.md` | All issues fixed, user approves |
| 5. Deploy | `05-deployment.md` | Checklist passed, user confirms commit |

Agents: `feature-reviewer` (Stage 4), `playwright-test-writer` (Stage 3b) — both in `.claude/agents/`.
Document templates are in `docs/features/_template/`.

**What counts as a feature:** any new page, any new data model, any new multi-component section, any auth or backend work. Small isolated fixes (typo, color tweak, single-prop change) do not require the full workflow.

## Available Skills

| Command | Use for |
|---|---|
| `/feature [description]` | Any new feature — full Plan→Design→Build→Review→Deploy workflow |
| `/fe [description]` | Small isolated frontend fix — single component or style change |
| `/be [description]` | Small isolated backend fix — single action or schema change |

---

## Profile Dropdown

Lives in `components/layout/ProfileDropdown.tsx`, embedded in `Header.tsx` replacing the static avatar.

**Trigger:** clicking the avatar in the top-right of the header.

**Behaviour:**
- Click avatar → animated dropdown opens (`scale + opacity`, 0.15s)
- Click outside → dropdown closes
- Shows avatar, name, email, "Edit profile" link, Settings nav item, Sign out button
- "Edit profile" → `router.push("/settings/profile")` then closes dropdown
- Settings → `router.push("/settings")` then closes dropdown
- Sign out → closes dropdown only (auth not wired yet)

**State:** `open` only — name/email are read directly from `userProfile` in `lib/dummy-data.ts` (no local editing state).

**Rules:**
- Initials are derived: first letter of each word (max 2), uppercased — `getInitials(name)`
- Dropdown is `z-50`, right-aligned to the avatar, `w-64`, `rounded-xl` with two-layer shadow (floating UI standard)
- Click-outside uses `useRef` + `document.addEventListener("mousedown", ...)` in `useEffect`
- Never hard-code initials — always derive from `userProfile.name`

## Profile Page

Lives at `app/(dashboard)/settings/profile/page.tsx`. A dedicated page for editing user profile details.

**Fields:** name (text), email (email), currency (select from `CURRENCIES` list), timezone (select from `TIMEZONES` list).

**Behaviour:**
- Live avatar preview updates as the user types their name
- Save button shows "Changes saved" for 2s then resets
- Local state only — dummy data phase, no persistence

**Rules:**
- `"use client"` — no metadata export
- Initializes state from `userProfile` in `lib/dummy-data.ts`
- `getInitials(name)` is defined locally (same logic as ProfileDropdown)

---

## Global Search

A command-palette-style overlay launched from the header. Lives in `components/layout/GlobalSearch.tsx` and is embedded in `Header.tsx`.

**Trigger:**
- Desktop (md+): compact bar `[🔍 Search… ⌘K]` always visible in header centre
- Mobile: `🔍` icon button in header right — opens same overlay
- Keyboard: `Cmd+K` / `Ctrl+K` anywhere; `Escape` closes

**Search scope:** active group only (filtered by `activeGroup.id`). Recipes are unscoped (no groupId).

**Types searched:** tasks · shopping items · notes · calendar events · expenses · income · budgets · loans · recipes

**Result format:**
```ts
type SearchResult = {
  id: string
  type: ResultType   // "task" | "shopping" | "note" | "calendar" | "expense" | "income" | "budget" | "loan" | "recipe"
  title: string
  subtitle: string   // secondary info e.g. "category · $amount"
  href: string       // page to navigate to on click
}
```

**Rules:**
- Max 4 results per type group
- Results grouped by type with labelled section headers
- Clicking a result: `router.push(href)` then close
- Searching is synchronous client-side `string.includes()` — no debounce needed with dummy data
- `buildResults()` and `groupResults()` are module-level pure functions inside `GlobalSearch.tsx` — do not extract to a separate utility file unless reused elsewhere

---

## Domain Models

### Notes

Notes are freeform text entries within a group, optionally attached to an event.

**`Note` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

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

**Note category list (canonical):**
General · Home · Finance · Health · Work · Personal · Shopping · Travel · Other

**Color → card style:**
default → `bg-card border-border/60` · blue → `bg-primary/5 border-primary/20` · green → `bg-success/5 border-success/20` · yellow → `bg-warning/5 border-warning/20` · rose → `bg-destructive/5 border-destructive/20`

**Note creation form fields:**
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
- `NotesGrid` accepts optional `onEdit?: (note: Note) => void` and `onDelete?: (id: string) => void` — when omitted it renders read-only (dashboard usage)
- `deleteId: string | null` lives in `NotesGrid`; `editingId: string | null` lives in `NotesSection`
- Delete confirmation replaces the right-side action area inline ("Delete? Yes No")
- Edit button hover uses `hover:bg-black/10 dark:hover:bg-white/10` (adapts to colored card backgrounds)
- `handleSave` on edit updates `updatedAt` to today's ISO date
- The add/edit form lives in `components/notes/NotesSection.tsx`, which owns a mutable `useState<Note[]>` and passes the list to `NotesGrid` via `data` prop

---

### Calendar

Calendar events are scheduled items within a group, optionally attached to an event.

**`CalendarEvent` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

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

**Calendar event creation form fields:**
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
- The add form lives in `components/calendar/CalendarSection.tsx`, which owns a mutable `useState<CalendarEvent[]>` and passes the list to both `CalendarGrid` and `UpcomingEvents` via `data` prop

---

### Shopping

Shopping items are grouped by store in the list view. Each item can optionally be attached to an event.

**`ShoppingItem` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

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

**Shopping category list (canonical):**
Produce · Dairy · Meat · Bakery · Frozen · Drinks · Snacks · Cleaning · Personal Care · Other

**Category → icon map:**
Produce → 🥦 · Dairy → 🥛 · Meat → 🥩 · Bakery → 🍞 · Frozen → 🧊 · Drinks → 🧃 · Snacks → 🍿 · Cleaning → 🧹 · Personal Care → 🧴 · Other → 🛍️

**Shopping item creation form fields:**
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
- `dashboard/ShoppingList.tsx` accepts `onEdit` and `onDelete` callbacks — when provided, edit/delete actions appear on each row
- The add/edit form lives in `components/shopping/ShoppingSection.tsx`, which owns `useState<ShoppingItem[]>` and passes the list + callbacks to `ShoppingList`

**Edit/delete pattern:**
- `editingId: string | null` lives in `ShoppingSection` — `null` = create, set = edit (form pre-filled)
- `deleteId: string | null` lives in `ShoppingList` — inline "Delete? Yes / No" per row; confirmed delete calls `onDelete(id)` up to `ShoppingSection`
- Edit preserves `checked` state — the done/collected toggle is local UI state in `ShoppingList` keyed by item ID
- `onEdit` and `onDelete` props are optional — when omitted, `ShoppingList` renders as a plain read-only widget (used on dashboard)

---

### Tasks

Tasks are action items within a group, optionally attached to an event.

**`Task` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

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

**Task category list (canonical):**
Chores · Bills · Shopping · Maintenance · Health · Personal · Work · Other

**Category → icon map:**
Chores → 🧹 · Bills → 💳 · Shopping → 🛒 · Maintenance → 🔧 · Health → 💊 · Personal → 👤 · Work → 💼 · Other → 📌

**Task creation form fields:**
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
- All/Pending/Done filter tabs
- `dashboard/TaskList.tsx` accepts `onEdit` and `onDelete` callbacks — when provided, edit/delete actions appear on each row
- The add/edit form lives in `components/tasks/TasksSection.tsx`, which owns `useState<Task[]>` and passes the list + callbacks to `TaskList`

**Edit/delete pattern:**
- `editingId: string | null` lives in `TasksSection` — `null` = create, set = edit (form pre-filled)
- `deleteId: string | null` lives in `TaskList` — inline "Delete? Yes / No" confirmation per row; confirmed delete calls `onDelete(id)` up to `TasksSection`
- Edit does not change `done` state — the done/undone toggle (`checked` Set) is local UI state in `TaskList` and is not reset on edit
- `onEdit` and `onDelete` props are optional — when omitted, `TaskList` renders as a plain read-only widget (used on dashboard)

---

### Finance — Budgets

Budgets are the core of the finance feature. A budget sets a spending (or income) limit for a category over a defined period.

**`Budget` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

```ts
type Budget = {
  id: string
  name: string                        // user-defined label e.g. "Groceries"
  type: "monthly" | "yearly"          // determines period length
  category: string                    // e.g. "Food & Dining"
  icon: string                        // emoji
  color: string                       // CSS var e.g. "var(--color-chart-2)"
  amount: number                      // budget limit in USD
  spent: number                       // amount used in the current period
  startDate: string                   // YYYY-MM-DD — when this budget was created
  period: string                      // human label e.g. "April 2026" or "2026"
}
```

**Rules:**
- `spent` is always ≤ or > `amount` — never negative
- `type: "monthly"` resets at the start of each calendar month; `type: "yearly"` resets Jan 1
- Progress = `spent / amount`. At 100%+ the budget is **over** (use `text-destructive`). At 80–99% it is **warning** (use `text-warning`). Below 80% it is **on track** (use `text-success`)
- The old flat `BudgetCategory` type is superseded by `Budget` — do not use `BudgetCategory` for new work

**Budget creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Name | string | Free text, required |
| Category | select | From a fixed category list |
| Type | radio | monthly \| yearly |
| Amount | number | USD, required, > 0 |
| Event | select | Optional — only shown when group has events |

**Category list (canonical):**
Food & Dining · Utilities · Entertainment · Health & Fitness · Shopping · Transportation · Housing · Education · Travel · Personal Care

**Edit/delete pattern:**
- `BudgetList` owns `useState<Budget[]>` (initialized from `userBudgets` in `useEffect`) — it does **not** read from the import directly after mount
- `editingId: string | null` — `null` = create mode, set to budget id = edit mode (form pre-filled)
- `deleteId: string | null` — when set, the row replaces its action icons with inline `"Delete? [Yes] [No]"` confirmation
- Edit opens the same form as create with `openEdit(b)` pre-filling all fields
- `handleSave()` either creates a new entry or updates the matching entry via `setBudgetList(prev => prev.map(...))`
- `handleDelete(id)` filters out the entry: `setBudgetList(prev => prev.filter(b => b.id !== id))`

---

### Finance — Expenses

Expenses are individual spending entries logged by the user. They may be one-off or recurring.

**`Expense` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

```ts
type Expense = {
  id: string
  title: string
  amount: number                       // positive USD — always a cost
  category: string                     // from the canonical category list
  icon: string                         // emoji
  date: string                         // YYYY-MM-DD — date incurred or first occurrence
  recurring: boolean
  frequency?: "weekly" | "fortnightly" | "monthly" | "yearly"  // only when recurring
  nextDate?: string                    // YYYY-MM-DD — next scheduled occurrence
  budgetId?: string                    // optional — links to a Budget
}
```

**Rules:**
- `amount` is always positive (it's a cost, sign is implied)
- `frequency` and `nextDate` are only present when `recurring: true`
- Recurring expenses show a frequency badge (e.g. "Monthly") in the UI
- `nextDate` is computed from `date` + `frequency` — do not derive in render, store it
- Category uses the same canonical list as Budgets

**Expense creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Title | string | Free text, required |
| Amount | number | USD, required, > 0 |
| Category | select | From canonical category list |
| Date | date | Defaults to today |
| Recurring | toggle | Off by default |
| Frequency | select | Only shown when Recurring is on: weekly \| fortnightly \| monthly \| yearly |

**Display rules:**
- Recurring tab shows only `recurring: true` entries, grouped or sorted by `nextDate`
- One-off tab shows only `recurring: false` entries, sorted by `date` desc
- All tab: combined, sorted by `date` desc
- Recurring frequency badge colours: weekly → `bg-primary/10 text-primary`, fortnightly → `bg-warning/10 text-warning`, monthly → `bg-success/10 text-success`, yearly → `bg-muted text-muted-foreground`

**Edit/delete pattern:**
- `ExpenseList` owns `useState<Expense[]>` (initialized via `useEffect` scope reset) — not read from import directly after mount
- `editingId: string | null` — `null` = create mode, set = edit mode (form pre-filled)
- `deleteId: string | null` — when set, the row shows inline `"Delete? [Yes] [No]"` confirmation
- Edit opens the same form with all fields pre-filled including `recurring`, `frequency`, and `eventId`
- On save: update `frequency`/`nextDate` from the edited values; clear them when switching to non-recurring
- `handleDelete(id)` filters: `setExpenses(prev => prev.filter(ex => ex.id !== id))`

---

### Finance — Income

Income entries record money coming in. They may be recurring (salary, rental) or one-off (freelance, bonus).

**`Income` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

```ts
type Income = {
  id: string
  title: string
  amount: number                       // positive USD — always a receipt
  category: string                     // from canonical income category list
  icon: string                         // emoji
  date: string                         // YYYY-MM-DD — date received or first occurrence
  recurring: boolean
  frequency?: "weekly" | "fortnightly" | "monthly" | "yearly"  // only when recurring
  nextDate?: string                    // YYYY-MM-DD — next scheduled occurrence
}
```

**Rules:**
- `amount` is always positive
- `frequency` and `nextDate` are only present when `recurring: true`
- Amount is displayed in `text-success` to distinguish from expenses
- Same frequency badge colours as Expenses

**Income category list (canonical):**
Salary · Freelance · Rental Income · Investment · Business Income · Government Benefits · Gift · Other

**Income creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Title | string | Free text, required |
| Amount | number | USD, required, > 0 |
| Category | select | From income category list |
| Date | date | Defaults to today |
| Recurring | toggle | Off by default |
| Frequency | select | Only shown when Recurring is on: weekly \| fortnightly \| monthly \| yearly |

**Edit/delete pattern:**
- `IncomeList` owns `useState<Income[]>` (initialized via `useEffect` scope reset) — not read from import directly after mount
- `editingId: string | null` — `null` = create mode, set = edit mode (form pre-filled)
- `deleteId: string | null` — when set, the row shows inline `"Delete? [Yes] [No]"` confirmation
- Edit opens the same form with all fields pre-filled including `recurring`, `frequency`, and `eventId`
- On save: update `frequency`/`nextDate` from the edited values; clear them when switching to non-recurring
- `handleDelete(id)` filters: `setIncomes(prev => prev.filter(inc => inc.id !== id))`

---

### Finance — Loans

Loans track money lent to others and money borrowed from others, with optional interest and repayment history.

**`Loan` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

```ts
type Loan = {
  id: string
  direction: "lent" | "borrowed"  // "lent" = they owe me; "borrowed" = I owe them
  contact: string                  // person's name
  principal: number                // original amount in USD
  interestRate: number             // annual simple interest % (0 = interest-free)
  startDate: string                // YYYY-MM-DD
  dueDate?: string                 // YYYY-MM-DD — optional
  notes?: string
  groupId: string
  eventId?: string
}
```

**`LoanRepayment` type:**

```ts
type LoanRepayment = {
  id: string
  loanId: string
  amount: number
  date: string                     // YYYY-MM-DD
  note?: string
}
```

**Outstanding balance (computed on render, never stored):**
```ts
const days = (new Date(TODAY) - new Date(loan.startDate)) / 86_400_000
const interest = loan.principal * (loan.interestRate / 100) * (days / 365)
const totalRepaid = repayments.filter(r => r.loanId === loan.id).reduce((s, r) => s + r.amount, 0)
const outstanding = Math.max(0, loan.principal + interest - totalRepaid)
```

**Loan status:**
- `settled` — outstanding === 0
- `overdue` — dueDate < TODAY && outstanding > 0
- `active` — otherwise

**Status badge colours:** active → `bg-success/10 text-success` · settled → `bg-muted text-muted-foreground` · overdue → `bg-destructive/10 text-destructive`

**Direction pill colours:** lent → `bg-primary/10 text-primary` · borrowed → `bg-warning/10 text-warning`

**Loan creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Direction | segmented control | "I lent" \| "I borrowed" — side by side |
| Contact | string | Required |
| Amount | number | USD, required, > 0 |
| Interest rate | number | Annual %, default 0 |
| Start date | date | Required, defaults to today |
| Due date | date | Optional |
| Notes | string | Optional |
| Event | select | Optional — only shown when group has events |

**Repayment form fields (inline, per loan):**
| Field | Type | Notes |
|-------|------|-------|
| Amount | number | USD, required, > 0 |
| Date | date | Required, defaults to today |
| Note | string | Optional |

**Display rules:**
- Tabs: All / Lent / Borrowed
- Settled loans hidden by default — revealed by "Show settled" toggle
- Each loan row expands to show: principal, interest (separate), total repaid, repayment history, add-repayment form
- Stats: Lent Out (outstanding for lent), You Owe (outstanding for borrowed), Overdue (count), Settled (count)
- `LoanList` receives `onAddRepayment`, `onEdit`, `onDelete` callbacks — mutations always flow up to `LoansSection`
- `LoansSection` owns all state (`loanList`, `repayments`, `editingId`) and passes data down

**Edit/delete pattern:**
- `editingId: string | null` lives in `LoansSection` — `null` = create mode, set = edit mode (form pre-filled)
- `deleteId: string | null` lives in `LoanList` — inline "Delete? Yes / No" confirmation per card; confirmed delete calls `onDelete(id)` up to `LoansSection`
- Clicking the Pencil icon in a card calls `onEdit(loan)` → `LoansSection.openEdit(loan)` pre-fills all form fields and opens the form
- The card header row is split: a flex-1 expand button (left/center) + right-side div with outstanding, action buttons, and chevron — action buttons use `e.stopPropagation()` to avoid toggling expand
- `handleDelete(id)` in `LoansSection` removes the loan **and** all its repayments: `setRepayments(prev => prev.filter(r => r.loanId !== id))`

---

### Meals — Weekly Plan

The meal plan is a slot-based weekly grid. Each day (Mon–Sun) has three slots: breakfast, lunch, dinner — each holds a recipe ID (or `""` for empty).

**`DayMeals` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

```ts
type DayMeals = {
  day: string       // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  breakfast: string // recipe id, or "" if unset
  lunch: string
  dinner: string
  groupId: string
  eventId?: string
}
```

**`Recipe` type:**
```ts
type Recipe = {
  id: string
  name: string
  mealType: "breakfast" | "lunch" | "dinner"
  prepTime: number   // minutes
  calories: number
  servings: number
  tags: string[]
  icon: string
}
```

**Rules:**
- `breakfast`, `lunch`, `dinner` are always present but can be `""` (empty slot)
- Adding a meal is an **upsert**: find the existing `DayMeals` for that day (matching `groupId` and `eventId`) and update the slot; if no entry exists for that day, create a new one with all other slots empty
- Stats: mealsPlanned = count of non-empty slots across the filtered plan

**Meal add/edit form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Day | select | Mon–Sun |
| Meal | select | Breakfast \| Lunch \| Dinner |
| Recipe | select | From the `recipeList` state (show icon + name) |
| Event | select | Optional — only shown when group has events |

**Recipe add/edit form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Name | string | Free text, required |
| Icon | string | Emoji, auto-defaulted by meal type on create |
| Meal type | select | breakfast \| lunch \| dinner |
| Prep time | number | Minutes, required |
| Calories | number | Required |
| Servings | number | Required |
| Tags | string | Comma-separated, optional |

**Display rules (meal plan):**
- `WeeklyPlanGrid` accepts optional `onEdit?: (day, mealKey, recipeId) => void` and `onDelete?: (day, mealKey) => void` — when omitted it renders read-only
- `deleteSlot: { day: string; mealKey: MealKey } | null` lives in `WeeklyPlanGrid`; `editingSlot: { day: string; mealKey: MealKey } | null` lives in `MealsSection`
- Edit/delete buttons appear on hover (`opacity-0 group-hover:opacity-100`) inside each filled slot pill
- Delete confirmation replaces the slot content inline ("Delete? Yes No") — compact to fit grid cells
- Deleting a slot sets it to `""` and removes the `DayMeals` entry entirely if all 3 slots become empty
- Edit pre-fills the form and scrolls to it; save is the same upsert as create

**Display rules (recipes):**
- `RecipeList` accepts `data?: Recipe[]`, `onSave?: (recipe: Recipe) => void`, `onDelete?: (id: string) => void`
- When `onSave`/`onDelete` are provided, "Add recipe" button + Pencil/Trash2 per row appear; otherwise read-only
- `deleteId: string | null` and all form state live in `RecipeList`; `editingId` also lives in `RecipeList`
- `RecipeList` calls `onSave(recipe)` for both create and edit (upsert by id)
- Empty meal type sections show "No recipes yet" placeholder

**State ownership:**
- `MealsSection` owns `useState<DayMeals[]>` + `useState<Recipe[]>` (initialized from `recipes` import)
- `recipeList` is passed to both `RecipeList` (as `data`) and used in the meal form recipe dropdown
- `handleRecipeDelete` in `MealsSection` also clears deleted recipe from `planData` slots
- Stats (`recipeCount`, `avgPrep`, `avgCal`) are derived from `recipeList` state

**Edit/delete pattern (meal plan):**
- `editingSlot` in `MealsSection` — `null` = create, set = edit (form pre-filled with that slot's day/mealKey/recipeId)
- `deleteSlot` in `WeeklyPlanGrid` — inline "Delete? Yes / No" replaces slot content; confirmed delete calls `onDelete(day, mealKey)` up to `MealsSection`
- `handleDelete` clears the slot and drops the `DayMeals` row if all slots empty
- `handleSave` is a single upsert that handles both create and edit

---

### Groups

Groups are **households** — permanent locations a user manages (home in Brisbane, home in India, parents' house, etc.). Every data type carries `groupId: string`.

**`Group` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

```ts
type Group = {
  id: string
  name: string                                              // e.g. "My Home", "India Home"
  type: "household"                                        // always — events are a separate model
  currency: string                                         // ISO 4217 code e.g. "AUD", "USD", "INR"
  description?: string
  location?: string                                        // city / address
  color: "primary" | "success" | "destructive" | "warning"
  icon: string                                             // emoji
  isDefault?: boolean
}
```

**Canonical dummy groups:**
| id | name | location | color |
|----|------|----------|-------|
| g1 | My Home | Brisbane | primary |
| g2 | Mum's House | Sydney | success |

**Edit/delete pattern (`GroupsManager`):**
- `editingId: string | null` — `null` = create mode, set = edit mode (form pre-filled)
- `deleteId: string | null` — inline "Delete? Yes / No" per row; confirmed delete calls `handleDelete(id)`
- Edit button (Pencil) appears on all groups; delete button (Trash2) only on non-default groups
- `openEdit(g)` pre-fills the form and scrolls to it
- `handleSave` upserts: updates existing if `editingId` is set, otherwise creates new
- The default group (`isDefault: true`) can be edited but not deleted

### Events

Events are **time-bound activities** (trips, weddings, renovations, etc.) that belong to a parent group. Event-scoped data is tracked separately from the household's regular data.

**`Event` type** (canonical, lives in `lib/dummy-data.ts` now, Prisma schema later):

```ts
type AppEvent = {
  id: string
  groupId: string                                          // parent household
  name: string                                             // e.g. "Wedding 2026", "Europe Trip"
  description?: string
  icon: string                                             // emoji
  color: "primary" | "success" | "destructive" | "warning"
  startDate: string                                        // YYYY-MM-DD
  endDate?: string                                         // YYYY-MM-DD
}
```

**Canonical dummy events:**
| id | groupId | name | color |
|----|---------|------|-------|
| ev1 | g1 | Wedding 2026 | destructive |
| ev2 | g1 | Europe Trip | warning |

**Edit/delete pattern (`EventsManager`):**
- `editingId: string | null` — `null` = create mode, set = edit mode (form pre-filled)
- `deleteId: string | null` — inline "Delete? Yes / No" per row; confirmed delete calls `handleDelete(id)`
- `openEdit(ev)` pre-fills all form fields (name, groupId, startDate, endDate, icon, color) and scrolls to the form
- `handleSave` upserts: updates existing if `editingId` is set, otherwise creates new
- Events are displayed grouped by household; each event row has Pencil + Trash2 action buttons

**Data items with `eventId`:**
All data types (`Budget`, `Expense`, `Income`, `Task`, `ShoppingItem`, `Note`, `CalendarEvent`, `DayMeals`) carry an optional `eventId?: string`. When set, the item belongs to that event. `groupId` is always set (to the event's parent group) even when `eventId` is present.

**Color system (`COLOR_MAP` in `ScopeSwitcher`):**
| color value | bg | text | dot |
|---|---|---|---|
| `"primary"` | `bg-primary/10` | `text-primary` | `bg-primary` |
| `"success"` | `bg-success/10` | `text-success` | `bg-success` |
| `"destructive"` | `bg-destructive/10` | `text-destructive` | `bg-destructive` |
| `"warning"` | `bg-warning/10` | `text-warning` | `bg-warning` |

**`GroupSwitcher`** lives in `components/layout/GroupSwitcher.tsx` (file may be named `ScopeSwitcher.tsx` — keep whichever exists), sits in the Sidebar between the logo bar and nav. It shows **only groups (households)** — events are never listed here. Shows active group icon + name + location. Opens an animated dropdown listing all groups. Clicking a group calls `setActiveGroup(id)`. Click-outside detection uses `useRef` + `document.addEventListener("mousedown", ...)` in `useEffect`.

**Rules:**
- Every new data item is assigned `groupId: activeGroup.id` (always)
- Event-scoped items also get `eventId: activeEvent.id`
- Never hard-code group or event IDs — always read from `useGroup()`
- All filtered lists reset when scope changes (see Section component pattern)

---

## General Conventions

- TypeScript strict mode — no `any`, no implicit types
- Check `package.json` before introducing any new library
- Zod schemas in `lib/validations/` — shared between forms and server actions
- Prisma schema in `prisma/schema.prisma`
- Prisma client singleton in `lib/db/prisma.ts` — always import from here, never instantiate `PrismaClient` directly
- Reference patterns in `docs/patterns/`
