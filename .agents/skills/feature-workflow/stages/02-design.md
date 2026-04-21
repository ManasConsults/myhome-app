# Stage 2: Design

## Purpose

Define **how** to build the approved plan. Every technical decision is made and documented here. If a decision isn't in this document, it wasn't designed — stop and design it before building.

## Pre-Design Codebase Exploration

Before writing the design, explore the codebase to avoid reinventing patterns:
- Find the most similar existing page or feature
- Check `lib/dummy-data.ts` for relevant existing data structures
- Check `components/` for reusable components that should be used
- Check `docs/patterns/` for reference implementations
- Note any shadcn/ui components needed that aren't yet installed

## Document Template

```markdown
# Feature Design: {Feature Name}

**Date:** {YYYY-MM-DD}
**Status:** DRAFT → APPROVED
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

Brief description of how this fits into the existing app structure. RSC vs client component split decision.

## Route Structure

New or modified routes:

| Route | File | Type | Notes |
|-------|------|------|-------|
| `/path` | `app/(dashboard)/path/page.tsx` | RSC | ... |

## Data Model

### New types (add to `lib/dummy-data.ts` for now)

```ts
export interface NewType {
  id: string
  // ...
}
```

### New dummy data needed

Describe what entries to add to `lib/dummy-data.ts`.

## Component Design

List every component to be created or modified:

| Component | File | Type | Props |
|-----------|------|------|-------|
| `FeatureCard` | `components/feature/FeatureCard.tsx` | Client | `{ item: NewType }` |

### Component hierarchy

```
page.tsx (RSC)
  └── FeatureList (RSC)
        └── FeatureCard (Client — needs interaction)
              └── FeatureModal (Client)
```

## State Management

- Server state: fetched in RSC, passed as props
- Client state: describe what `useState` / TanStack Query is needed
- Shared state: describe any Context changes

## Key UI Decisions

- Layout pattern (which existing page does this most resemble?)
- Mobile layout vs desktop layout differences
- Loading state approach (Skeleton? Suspense boundary?)
- Empty state copy and illustration
- Error state approach

## shadcn/ui Components Needed

List any shadcn components to install:
```bash
npx shadcn@latest add [component]
```

## Animations

Describe Framer Motion animations needed (entrance, interactions, transitions).

## Acceptance Criteria Mapping

Map each acceptance criterion from the plan to the component/route that implements it:

| Criterion | Implemented by |
|-----------|---------------|
| Given ... | `FeatureCard` component |

## Files to Create

- `app/(dashboard)/path/page.tsx`
- `components/feature/FeatureCard.tsx`
- ...

## Files to Modify

- `lib/dummy-data.ts` — add new types and data
- `components/layout/Sidebar.tsx` — add nav link if needed
- ...

## Out of Design Scope

Anything deferred to a later stage or iteration.
```

## Approval Gate

Present the completed document and ask:

> "Does this design look correct? Any changes before we start building?"

Do not proceed to Stage 3 until the user explicitly approves.
