# MyHome — Project Context

A multi-user, multi-household home management app. Features: finance tracking, tasks, shopping, calendar, notes, meal planning. Mobile-first, deployed on Vercel. Solo developer.

## Current Phase

Database-connected. Data is served from Neon PostgreSQL via Prisma 7. Real Auth.js v5 is planned but not wired up yet — cookie-based dummy auth is still active.

Core UI pages exist for all features. Groups are implemented — all data types carry a `groupId` and the active group is managed by `GroupProvider`. Finance is feature-complete: budgets (with edit/delete), expense tracking, income (recurring + one-off), and loan tracking (lend/borrow, repayment history, interest). Global search is implemented in the header. Active development: wiring remaining features to the database and implementing real auth.

### Auth

Real auth using bcrypt + httpOnly JWT cookie.

- **Session cookie:** `myhome-session` — httpOnly, Secure in production, SameSite=Lax, 7-day expiry. Value is a signed HS256 JWT containing `{ userId, name, email, role }`.
- **Secret:** `SESSION_SECRET` env var — 32-byte hex string. Required in `.env`, Vercel env vars, and GitHub Actions secrets.
- **Password hashing:** bcryptjs, cost factor 12. Legacy plaintext passwords are re-hashed on first login.
- **Route protection:** `proxy.ts` (project root) — Next.js 16 uses this directly (no `middleware.ts`). Public paths: `/login`, `/register`. Admin paths require `role === "admin"`.
- **Session functions:** `signSession(payload)` / `verifySession(token)` in `lib/session.ts` (async, jose).
- **Cookie management:** Set/cleared exclusively by server actions in `lib/actions/auth.ts` via `cookies()` from `next/headers`.
- **Auth context:** `AuthProvider` in `components/providers/AuthProvider.tsx` wraps the root layout. On mount fetches `/api/auth/me` (reads httpOnly cookie server-side). `useAuth()` returns `{ user: SessionPayload | null, setUser, logout }`.
- **`setUser(payload)`** — updates local display state only (cookie is already set by the server action that logged in the user).
- **`logout()`** — calls `logoutAction()` server action (clears cookie), then navigates to `/login`.
- **Roles:** `UserRole = "admin" | "manager" | "user"`. Seed user is `"admin"`. New registrations default to `"user"`, status `"pending"` — require admin approval before they can log in.
- **Role pill:** admin: `bg-primary/10 text-primary`, manager: `bg-warning/10 text-warning`, user: `bg-muted text-muted-foreground`. Labels — `"Admin"` / `"Manager"` / `"Member"`. Use `ROLE_PILL` constant defined locally in each component.
- **Profile page:** Initialises name/email from `useAuth().user`; saving calls `setUser()` to update local display state.
- **Seed user:** demo@myhome.app / demo1234 — password is bcrypt-hashed by `prisma/seed.ts`.

### Sort options

All list views have sort-by controls (Updated / Created / relevant domain fields) with asc/desc toggle. All data types carry `createdAt: string` and `updatedAt: string` (YYYY-MM-DD).

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
| Database | Neon PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
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
`next.config.ts` has `cacheComponents: true`. Cache slow/shared data; never cache user-specific real-time data.

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

#### Sidebar logo bar
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

The **active group** (household) is the primary scope — set from the sidebar GroupSwitcher. Within each feature page, the user can additionally filter by an **event** using an inline `EventFilter` bar. This event filter is global state scoped to the active group's events.

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
const filtered = activeEvent
  ? allItems.filter((i) => i.eventId === activeEvent.id)
  : allItems.filter((i) => i.groupId === activeGroup.id)  // includes event-tagged items
```

Note: when no event is filtered, the group view shows **all** items for the group — including event-tagged ones.

### Event selector in creation forms

All creation forms must include an optional **Event** field when the active group has events.

**Pattern:**
```tsx
const { activeGroup, activeEvent, events } = useGroup()
const groupEvents = events.filter(e => e.groupId === activeGroup.id)
const [eventId, setEventId] = useState(activeEvent?.id ?? "")

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

const newItem = { ...otherFields, groupId: activeGroup.id, ...(eventId ? { eventId } : {}) }
```

**Rules:**
- When `groupEvents.length === 0`, do not render the Event field at all
- Default the select to `activeEvent?.id ?? ""`
- Reset `eventId` to `""` (or `activeEvent?.id ?? ""`) after submit

### EventFilter component

Inline filter bar at the top of each feature Section. **All** + one pill per group event.

```tsx
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

Each feature has a `*Section` client component that:
1. Calls `useGroup()` to get scope state
2. Derives `groupEvents = events.filter(e => e.groupId === activeGroup.id)`
3. Filters data using the scope filtering logic
4. Renders `<EventFilter>` (when `groupEvents.length > 0`) then the list/grid component

Feature pages are thin RSC shells: `<Header />` + `<FeatureSection />`. All group/event logic lives in the Section component.

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
    finance/            # overview + budgets/ expenses/ income/ sub-routes
    tasks/ shopping/ notes/ calendar/ meals/
    settings/           # profile/ groups/ events/ sub-routes
  layout.tsx            # Root layout — ThemeProvider, ThemeColorProvider, fonts
  globals.css
components/
  calendar/             # CalendarGrid, UpcomingEvents, CalendarSection
  dashboard/            # Page-specific widgets (TaskList, ShoppingList, etc.)
  finance/              # BudgetList, ExpenseList, IncomeList, *Stats, FinanceSection
  layout/               # Shell: Header, Sidebar, MobileNav, GroupSwitcher
  meals/                # WeeklyPlanGrid, RecipeList, MealsSection
  notes/                # NotesGrid, NotesSection
  providers/            # ThemeProvider, ThemeColorProvider, GroupProvider
  settings/             # GroupsManager, EventsManager
  shopping/             # ShoppingSection
  tasks/                # TasksSection
  ui/                   # shadcn/ui primitives (do not modify directly)
lib/
  theme-colors.ts       # Color preset definitions + applyThemeColor()
  utils.ts              # cn() and shared utilities
  validations/          # Zod schemas (shared between forms + server actions)
  db/prisma.ts          # Prisma client singleton
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

Feature sub-nav uses a `subItems` array on `NavItem` in `Sidebar.tsx` and `MobileNav.tsx`. See `components/layout/CLAUDE.md` for full implementation spec (collapse/expand, Framer Motion pill, layoutId).

**Finance sub-nav:** Finance → `/finance` · Budgets → `/finance/budgets` · Expenses → `/finance/expenses` · Income → `/finance/income`

**Settings sub-nav:** Settings → `/settings` · Profile → `/settings/profile` · Groups → `/settings/groups` · Events → `/settings/events`

Settings lives in `bottomItems` — same `renderNavItem` pattern as `navItems`, supports collapse/expand.

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

## Feature-specific Context

Domain models, form fields, display rules, and edit/delete patterns live in per-component CLAUDE.md files — auto-loaded by Claude Code when editing files in that directory. When working on a feature page in `app/(dashboard)/`, read the relevant file manually.

| Feature | Context file |
|---------|-------------|
| Finance (budgets, expenses, income, loans) | `components/finance/CLAUDE.md` |
| Tasks | `components/tasks/CLAUDE.md` |
| Shopping | `components/shopping/CLAUDE.md` |
| Notes | `components/notes/CLAUDE.md` |
| Calendar | `components/calendar/CLAUDE.md` |
| Meals | `components/meals/CLAUDE.md` |
| Settings, Groups, Events, Profile | `components/settings/CLAUDE.md` |
| Sidebar sub-nav, ProfileDropdown, GlobalSearch | `components/layout/CLAUDE.md` |

---

## General Conventions

- TypeScript strict mode — no `any`, no implicit types
- Check `package.json` before introducing any new library
- Zod schemas in `lib/validations/` — shared between forms and server actions
- Prisma schema in `prisma/schema.prisma`
- Prisma client singleton in `lib/db/prisma.ts` — always import from here, never instantiate `PrismaClient` directly
- Reference patterns in `docs/patterns/`
