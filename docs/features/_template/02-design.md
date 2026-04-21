# Feature Design: {Feature Name}

**Date:** {YYYY-MM-DD}
**Status:** DRAFT
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

> How does this fit into the existing app? RSC vs client component split decision.

## Route Structure

| Route | File | Type | Notes |
|-------|------|------|-------|
| `/path` | `app/(dashboard)/path/page.tsx` | RSC | |

## Data Model

### New types

```ts
export interface NewType {
  id: string
}
```

### Dummy data additions

> Describe what entries to add to `lib/dummy-data.ts`.

## Component Design

| Component | File | Type | Props |
|-----------|------|------|-------|
| `FeatureCard` | `components/feature/FeatureCard.tsx` | Client | `{ item: NewType }` |

### Component hierarchy

```
page.tsx (RSC)
  └── ComponentA (RSC)
        └── ComponentB (Client)
```

## State Management

> Describe useState, TanStack Query, Context changes.

## Key UI Decisions

- Layout pattern:
- Mobile vs desktop differences:
- Loading state:
- Empty state:
- Error state:

## shadcn/ui Components Needed

```bash
# npx shadcn@latest add [component]
```

## Animations

> Framer Motion entrance, interactions, transitions.

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|---------------|
| Given ... | `ComponentName` |

## Files to Create

- `app/(dashboard)/path/page.tsx`

## Files to Modify

- `lib/dummy-data.ts` — add types and data
