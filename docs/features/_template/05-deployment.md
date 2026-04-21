# Feature Deployment: {Feature Name}

**Date:** {YYYY-MM-DD}
**Status:** READY → DEPLOYED
**Review:** [04-review.md](./04-review.md)
**Branch:** feature/{slug}

---

## Pre-Deployment Checklist

### Code Quality
- [ ] TypeScript — no errors (`npx tsc --noEmit`)
- [ ] Lint — no errors (`npx next lint`)
- [ ] No `console.log`
- [ ] No `test.only` / `test.skip`

### Functionality
- [ ] Mobile (375px) ✅
- [ ] Desktop (1280px) ✅
- [ ] Dark mode ✅
- [ ] All theme accent colors ✅
- [ ] All visual states (loading, empty, error, populated) ✅

### Completeness
- [ ] All acceptance criteria from plan are met
- [ ] No TODO comments remaining
- [ ] All five stage documents exist and complete

### Environment
- [ ] No new env vars (or `.env.example` updated)
- [ ] No undocumented new dependencies

---

## Commit Message

```
feat({scope}): {description}

{body}
```

## Deployment Notes

> Any notes for the PR reviewer or future reference.

## Rollback Plan

Revert the feature branch commit or close the PR without merging.
