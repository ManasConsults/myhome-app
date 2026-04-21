# Stage 4: Review

## Purpose

Verify the built feature meets every project standard before it ships. The reviewer is independent — it reads the code fresh, not through the builder's eyes.

## Review Process

Spawn the `feature-reviewer` agent (`.claude/agents/feature-reviewer.md`) with the list of files created/modified in the build log. The agent returns a structured review report.

Agent prompt pattern:
```
Review the following files for the {feature-name} feature against all project standards.
Files to review: [list from build log]
Produce a structured review report using the template in stages/04-review.md.
```

If significant issues are found, fix them and re-run the review before writing the final document.

## What the Reviewer Checks

### shadcn/ui Rules
- [ ] `size-*` used everywhere (no `w-* h-*`)
- [ ] `flex flex-col gap-*` (no `space-y-*`)
- [ ] Semantic color tokens only (no raw Tailwind palette)
- [ ] Icons inside `Button` use `data-icon`, no size classes
- [ ] `cn()` for all conditional classes

### Next.js 16 Rules
- [ ] No async client components
- [ ] `params` / `searchParams` / `cookies()` / `headers()` all awaited
- [ ] `"use client"` only where hooks / events / browser APIs are used
- [ ] No non-serializable props (Date, Map, Set, class instances) passed to client components
- [ ] `'use cache'` used where appropriate on expensive RSC data

### TypeScript
- [ ] No `any`
- [ ] No implicit types
- [ ] All props typed explicitly

### Design & Accessibility
- [ ] All visual states present (loading, empty, error, populated)
- [ ] Semantic HTML elements used correctly
- [ ] Touch targets ≥ 44px on mobile
- [ ] Mobile layout correct at 375px
- [ ] ARIA labels on interactive elements without visible text

### Framer Motion
- [ ] Animations use `motion.*` / `variants` / `AnimatePresence`
- [ ] No raw CSS transitions for entrance/exit animations
- [ ] Durations 200–400ms

### General
- [ ] No comments on self-evident code
- [ ] No unused imports or variables
- [ ] No console.log left in
- [ ] Follows file/folder structure from CLAUDE.md

## Review Document Template

```markdown
# Feature Review: {Feature Name}

**Date:** {YYYY-MM-DD}
**Status:** ISSUES FOUND → ALL RESOLVED
**Build log:** [03-build-log.md](./03-build-log.md)
**Files reviewed:** [list]

---

## Summary

[One paragraph overall assessment]

## Issues Found

### Critical (must fix before deploy)

| # | File | Line | Issue | Fix applied |
|---|------|------|-------|-------------|
| 1 | `components/X.tsx` | 42 | `w-4 h-4` should be `size-4` | ✅ Fixed |

### Minor (should fix)

| # | File | Line | Issue | Fix applied |
|---|------|------|-------|-------------|

### Notes (no action required)

Observations that don't require changes.

---

## Checklist Results

| Category | Status |
|----------|--------|
| shadcn/ui rules | ✅ Pass |
| Next.js 16 rules | ✅ Pass |
| TypeScript | ✅ Pass |
| Design & Accessibility | ✅ Pass |
| Framer Motion | ✅ Pass |
| General | ✅ Pass |

---

## Final Verdict

**APPROVED FOR DEPLOYMENT** / **REQUIRES CHANGES** (list remaining)
```

## Approval Gate

Present the review document and ask:

> "All issues resolved. Review passed. Ready to prepare for deployment?"

Do not proceed to Stage 5 until the user explicitly confirms.
