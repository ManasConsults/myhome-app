# Stage 1: Plan

## Purpose

Define **what** to build and **why**. No technical decisions are made here. This document is the source of truth for scope — anything not listed is out of scope.

## Clarifying Questions to Ask

Before writing the plan, resolve any ambiguity:
- Who uses this feature? (all users, household owner, specific role?)
- What problem does it solve / what job does it do for them?
- Is there an existing pattern in the app this should follow?
- Any known constraints (deadline, integration with upcoming features)?

## Document Template

```markdown
# Feature Plan: {Feature Name}

**Date:** {YYYY-MM-DD}
**Status:** DRAFT → APPROVED
**Feature slug:** {kebab-case-name}

---

## Problem Statement

What problem does this solve? For whom? What happens today without this feature?

## Proposed Solution

One paragraph describing what we are building at a user-facing level. No technical terms.

## User Stories

- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Acceptance Criteria

These must be testable and user-facing. Each criterion maps to a Playwright test later.

- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]

## Out of Scope

Explicitly list what this feature will NOT include. This prevents scope creep during build.

- X is not included in this iteration
- Y will be addressed in a follow-up

## Risks & Open Questions

List anything that might block progress or require a decision before design begins.

- Question: ...
- Risk: ...

## Complexity Estimate

- [ ] Small — < half a day (UI only, no new data)
- [ ] Medium — 1–2 days (new page/component + data wiring)
- [ ] Large — 3+ days (new data model, multiple pages, auth changes)
```

## Approval Gate

Present the completed document and ask:

> "Does this plan look correct? Any changes before we move to design?"

Do not proceed to Stage 2 until the user explicitly approves.
