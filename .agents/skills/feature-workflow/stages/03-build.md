# Stage 3: Build

## Purpose

Implement exactly what was designed. Every task comes from the approved design document. Deviations must be documented in the build log — never silently.

## Pre-Build Checklist

Before writing any code:
- [ ] Design document is approved
- [ ] All files to create/modify are listed in the design
- [ ] Any new shadcn/ui components are installed
- [ ] TodoWrite tasks created from the design's file list

## Build Process

### 1. Create tasks with TodoWrite

Break the design into concrete implementation tasks, one per file or logical unit:

```
- [ ] Add types and dummy data to lib/dummy-data.ts
- [ ] Create app/(dashboard)/path/page.tsx
- [ ] Create components/feature/FeatureCard.tsx
- [ ] Add nav link to Sidebar.tsx
- [ ] Add loading.tsx and error.tsx to route
```

Mark each task complete immediately after finishing it.

### 2. Implement in dependency order

Follow this order to avoid import errors:
1. Types and data (`lib/dummy-data.ts`)
2. Utility functions (`lib/`)
3. Leaf components (no children)
4. Composite components
5. Page files
6. Layout/navigation changes

### 3. Follow all project conventions

At every file, apply:
- `size-*` not `w-* h-*`
- `flex flex-col gap-*` not `space-y-*`
- Semantic color tokens only
- `cn()` for conditional classes
- No `any`, no implicit types
- RSC by default, `"use client"` only when needed
- Async `params` / `searchParams` / `cookies()` — always await

### 4. Verify before logging

Run both checks and fix all errors before writing the build log:

```bash
npx tsc --noEmit
npx next lint
```

## Build Log Template

```markdown
# Feature Build Log: {Feature Name}

**Date:** {YYYY-MM-DD}
**Status:** COMPLETE
**Design:** [02-design.md](./02-design.md)

---

## Files Created

| File | Purpose |
|------|---------|
| `app/(dashboard)/path/page.tsx` | Route entry point |
| `components/feature/FeatureCard.tsx` | Card widget |

## Files Modified

| File | What changed |
|------|-------------|
| `lib/dummy-data.ts` | Added `NewType` interface and 5 sample entries |
| `components/layout/Sidebar.tsx` | Added nav link |

## TypeScript Check

```
npx tsc --noEmit → ✅ No errors
```

## Lint Check

```
npx next lint → ✅ No errors
```

## Deviations from Design

Document any deviation from the approved design, with reason:

- **Deviation:** Used `X` instead of designed `Y`
  **Reason:** Y wasn't available / caused conflict with Z
  **Impact:** Low — visually equivalent

*(If none: "No deviations from approved design.")*
```

## Approval Gate

Present the build log and ask:

> "Build complete. All checks passing. Ready to move to review?"

Do not proceed to Stage 4 until the user explicitly confirms.
