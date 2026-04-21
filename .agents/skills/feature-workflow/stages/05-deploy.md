# Stage 5: Deploy

## Purpose

Ship the reviewed feature safely. Every deployment has a documented checklist and a conventional commit that can be traced back to this feature's documents.

## Pre-Deployment Checklist

Work through every item before asking the user to confirm deployment.

### Code Quality
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx next lint` — zero errors
- [ ] No `console.log` in production code
- [ ] No `.only` or `.skip` in Playwright tests

### Functionality
- [ ] Feature works on mobile (375px)
- [ ] Feature works on desktop (1280px+)
- [ ] Dark mode renders correctly
- [ ] All theme accent colors render correctly
- [ ] All visual states present: loading, empty, error, populated

### Completeness
- [ ] All acceptance criteria from the plan are met
- [ ] No TODO comments left in code
- [ ] All four stage documents exist and are marked complete

### Environment
- [ ] No new environment variables needed (or `.env.example` updated)
- [ ] No new dependencies added without `package.json` check
- [ ] `next build` runs without error (optional but recommended)

## Deployment Document Template

```markdown
# Feature Deployment: {Feature Name}

**Date:** {YYYY-MM-DD}
**Status:** READY → DEPLOYED
**Review:** [04-review.md](./04-review.md)
**Branch:** feature/{slug}

---

## Pre-Deployment Checklist

### Code Quality
- [x] TypeScript — no errors
- [x] Lint — no errors
- [x] No console.log
- [x] No test.only / test.skip

### Functionality
- [x] Mobile (375px) ✅
- [x] Desktop (1280px) ✅
- [x] Dark mode ✅
- [x] All theme colors ✅
- [x] All visual states ✅

### Completeness
- [x] All acceptance criteria met
- [x] No TODOs remaining
- [x] All stage documents complete

### Environment
- [x] No new env vars / env vars documented

---

## Commit

```
feat({scope}): {description}

{body — what was built and why, reference to plan}
```

## Deployment Notes

Any notes for the PR reviewer or for future reference.

## Rollback Plan

How to revert if issues are found in preview/production:
- Revert the feature branch commit, or
- Delete the feature branch and re-open from main
```

## Deployment Steps

1. Produce and verify `docs/features/{slug}/05-deployment.md`
2. **STOP** — present checklist and ask: _"Deployment checklist complete. Shall I commit and push to the feature branch?"_
3. On confirmation:
   ```bash
   git add [specific files — never git add -A]
   git commit -m "feat({scope}): {description}"
   git push -u origin feature/{slug}
   ```
4. Report the branch name to the user — they create the PR

## Never

- Never push directly to `main`
- Never use `git add -A` or `git add .` (could include `.env`, secrets)
- Never use `--no-verify`
- Never skip the checklist
