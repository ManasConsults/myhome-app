# Feature Plan: Global Search

**Date:** 2026-04-08
**Status:** APPROVED
**Feature slug:** global-search

---

## Problem Statement

There's no way to find an item without knowing which section it lives in. As data grows across tasks, shopping, notes, finance, calendar, and meals, navigating to the right page to find something is slow.

## Proposed Solution

A global search bar in the header. Clicking it opens a command-palette-style overlay with a text input. Typing searches across all data types in the active group and returns categorised results. Clicking a result navigates to the relevant section page and closes the overlay.

## User Stories

- As a user, I want to type a name and immediately find it across tasks, notes, shopping, etc.
- As a user, I want results grouped by type so I can tell at a glance what kind of item it is
- As a user, I want to press Escape to close the search without navigating
- As a user, I want Cmd+K / Ctrl+K to open search from anywhere

## Acceptance Criteria

- [ ] Header shows a search trigger (compact bar on desktop, icon on mobile)
- [ ] Clicking trigger opens a full-screen overlay with autofocused input
- [ ] Typing searches: tasks, shopping items, notes, calendar events, expenses, income, budgets, loans, recipes
- [ ] Results filtered to the active group (recipes are global)
- [ ] Results grouped by type with section labels, max 4 per group
- [ ] Clicking a result navigates to the correct page and closes overlay
- [ ] Escape key closes overlay
- [ ] Cmd+K / Ctrl+K opens overlay from anywhere

## Out of Scope

- Keyboard navigation through results (arrow keys)
- Full-text search within note content beyond a simple contains match
- Searching across all groups simultaneously

## Complexity Estimate

- [ ] Small
- [x] Medium
- [ ] Large
