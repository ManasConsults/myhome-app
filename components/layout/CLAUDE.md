# Layout — Navigation, ProfileDropdown, GlobalSearch

## Sidebar Sub-navigation

Features with sub-pages use an always-visible sub-nav group in the sidebar and MobileNav. The parent item links to the feature overview; sub-items link to sub-pages.

Sub-nav is defined in `Sidebar.tsx` and `MobileNav.tsx` via a `subItems` array on the parent `NavItem`:

```ts
type SubItem = { href: string; label: string; icon: LucideIcon }
type NavItem  = { href: string; label: string; icon: LucideIcon; subItems?: SubItem[] }
```

- Parent item is active (layoutId pill) when `pathname === parent.href` exactly
- Sub-items use `layoutId="sidebar-sub-active"` so the Framer Motion pill animates independently
- When on any sub-route, parent item shows "in-section" style (`bg-sidebar-accent`) without the primary pill
- Sub-items are indented: `ml-3 pl-3 border-l border-sidebar-border`

### Collapse/expand toggle

- `ChevronDown` button at the right edge of the parent item row — toggles sub-menu without navigating
- Expanded state stored in `localStorage["myhome-nav-expanded"]` as `Record<string, boolean>` keyed by parent `href`
- Initialized via `useEffect` after mount (never in `useState` initialiser) — avoids SSR hydration mismatch
- Auto-expands when user navigates directly to a sub-route while parent is collapsed
- Default state: all groups expanded (`true`)
- Sub-items animate with Framer Motion: `AnimatePresence initial={false}`, `height: 0 → "auto"`
- Parent item row flex split: `Link` (flex-1, navigates) + `button` (fixed width, toggles). Active pill uses `pointer-events-none` so both remain clickable beneath it

### Finance sub-nav (canonical)
- Finance → `/finance` (overview: summary cards + charts)
- Budgets → `/finance/budgets`
- Expenses → `/finance/expenses`
- Income → `/finance/income`

### Settings sub-nav (canonical)
- Settings → `/settings` (general: profile, appearance, preferences)
- Profile → `/settings/profile` (edit name, email, currency, timezone)
- Groups → `/settings/groups` (manage households — create, edit, delete)
- Events → `/settings/events` (manage events — create, edit, delete, link to group)

Settings lives in `bottomItems` in the sidebar. `bottomItems` supports the same `renderNavItem` pattern as `navItems`, so Settings can have collapse/expand sub-items with the same animated pill.

---

## ProfileDropdown

Lives in `components/layout/ProfileDropdown.tsx`, embedded in `Header.tsx`.

**Trigger:** clicking the avatar in the top-right of the header.

**Behaviour:**
- Click avatar → animated dropdown opens (`scale + opacity`, 0.15s)
- Click outside → dropdown closes
- Shows avatar, name, email, "Edit profile" link, Settings nav item, Sign out button
- "Edit profile" → `router.push("/settings/profile")` then closes dropdown
- Settings → `router.push("/settings")` then closes dropdown
- Sign out → calls `useAuth().logout()` which clears the cookie and navigates to `/login`

**Rules:**
- Initials derived: first letter of each word (max 2), uppercased — `getInitials(name)`
- Dropdown is `z-50`, right-aligned to the avatar, `w-64`, `rounded-xl` with two-layer shadow (floating UI standard)
- Click-outside uses `useRef` + `document.addEventListener("mousedown", ...)` in `useEffect`
- Name/email read from `useAuth().user` — never hard-code
- Role pill shown next to name — use local `ROLE_PILL` constant for colour mapping

---

## GlobalSearch

A command-palette-style overlay launched from the header. Lives in `GlobalSearch.tsx`, embedded in `Header.tsx`.

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
