---
name: feature-workflow
description: Full feature development lifecycle for MyHome. Enforces Plan → Design → Build → Review → Deploy. Produces a verified document at each stage. Use for every new feature, page, or significant change.
user-invocable: true
---

# Feature Workflow

Every feature goes through five stages in order. No stage can be skipped. Each stage produces a document. Each document must be explicitly approved before the next stage begins.

## Usage

```
/feature [description]
```

If no description is provided, ask the user for one before starting.

---

## The Five Stages

```
Stage 1:  Plan    →  docs/features/{slug}/01-plan.md
Stage 2:  Design  →  docs/features/{slug}/02-design.md
Stage 3:  Build   →  docs/features/{slug}/03-build-log.md
Stage 3b: Tests   →  e2e/{slug}.spec.ts
Stage 4:  Review  →  docs/features/{slug}/04-review.md
Stage 5:  Deploy  →  docs/features/{slug}/05-deployment.md
```

`{slug}` is the feature name in kebab-case (e.g. `calendar-view`, `meal-planner`).

---

## Stage 1 — Plan

See [stages/01-plan.md](./stages/01-plan.md)

**Goal:** Define what to build and why. No technical decisions.

**Steps:**
1. Enter plan mode (`EnterPlanMode`)
2. Ask clarifying questions if the brief is ambiguous
3. Produce `docs/features/{slug}/01-plan.md` using the template
4. **STOP** — present the document and ask: _"Does this plan look correct? Any changes before we move to design?"_
5. Only proceed to Stage 2 when the user explicitly approves

---

## Stage 2 — Design

See [stages/02-design.md](./stages/02-design.md)

**Goal:** Define how to build it. All technical decisions are made here — none during build.

**Steps:**
1. Read the approved plan
2. Explore the codebase — find related files, patterns, existing data structures
3. Produce `docs/features/{slug}/02-design.md` using the template
4. **STOP** — present the document and ask: _"Does this design look correct? Any changes before we start building?"_
5. Only proceed to Stage 3 when the user explicitly approves

---

## Stage 3 — Build

See [stages/03-build.md](./stages/03-build.md)

**Goal:** Implement exactly what was designed. No scope creep, no undocumented deviations.

**Steps:**
1. Read the approved design
2. Use `TodoWrite` to break the work into tasks from the design
3. Implement each task, marking it complete as you go
4. Run `npx tsc --noEmit` and `npx next lint` — fix all errors
5. Produce `docs/features/{slug}/03-build-log.md` documenting files changed and any deviations from the design
6. **STOP** — present the build log and ask: _"Build complete. Ready to move to review?"_

---

## Stage 3b — Tests

**Goal:** Write e2e tests before review, so the reviewer can verify tests exist and pass.

**Steps:**
1. Spawn the `playwright-test-writer` agent with paths to `01-plan.md`, `02-design.md`, and `03-build-log.md`
2. Agent produces `e2e/{slug}.spec.ts`
3. Add the test file to the build log under Files Created

---

## Stage 4 — Review

See [stages/04-review.md](./stages/04-review.md)

**Goal:** Verify the build meets all project standards before shipping.

**Steps:**
1. Spawn a review agent using the `feature-reviewer` agent definition
2. The reviewer checks against: shadcn rules, next-best-practices, frontend-design, CLAUDE.md conventions
3. Produce `docs/features/{slug}/04-review.md` with all findings
4. Fix every issue found — re-run the review if significant changes were made
5. **STOP** — present the review and ask: _"All issues resolved. Ready to prepare for deployment?"_

---

## Stage 5 — Deploy

See [stages/05-deploy.md](./stages/05-deploy.md)

**Goal:** Ship safely with a documented deployment record.

**Steps:**
1. Produce `docs/features/{slug}/05-deployment.md` with the pre-deployment checklist
2. Verify every checklist item
3. **STOP** — present the checklist and ask: _"Deployment checklist complete. Shall I commit and push to the feature branch?"_
4. Only commit and push when the user explicitly confirms
5. Never push directly to `main` — always push to the feature branch

---

## Invariants

- Never start coding before Stage 2 is approved
- Never skip a stage
- Never proceed without explicit user approval ("approved", "looks good", "proceed", "yes")
- If a stage reveals a problem with a prior stage, go back — document the reason in the current stage doc
- All documents persist — they are the audit trail for the feature
