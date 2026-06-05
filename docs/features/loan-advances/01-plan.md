# Feature Plan: Loan Advances

**Date:** 2026-06-05
**Status:** DRAFT
**Feature slug:** loan-advances

---

## Problem Statement

When you lend someone money (or borrow), the arrangement often isn't a single transaction. You may lend an additional amount to the same person for the same reason at a later date. Currently the loan `principal` is fixed at creation — there's no way to record these follow-on advances without editing the original amount (which destroys history). Repayments are already tracked as a history; advances need the same treatment.

## Proposed Solution

Add an **"Add advance"** action inside each loan's expanded panel, alongside the existing "Add repayment" button. Submitting an advance amount directly increments the loan's `principal` field via the existing `updateLoan` action — no new model or migration required. The outstanding balance automatically reflects the updated principal.

## User Stories

- As a user, I want to add an additional amount to an existing loan so that I can record follow-on lending to the same person without creating a separate loan.
- As a user, I want the outstanding balance to automatically reflect the increased principal.

## Acceptance Criteria

- [ ] Given an active or overdue loan, when I click "Add advance", an amount input form appears inline.
- [ ] Submitting the form calls `updateLoan` with `principal += advanceAmount`, then invalidates the loans query.
- [ ] The updated principal is reflected immediately in the card's expanded breakdown.
- [ ] Settled loans do not show the "Add advance" button.

## Out of Scope

- Per-advance history/audit trail (principal is updated in place)
- Interest recalculation per advance tranche

## Risks & Open Questions

- None — uses existing `updateLoan` action and query invalidation.

## Complexity Estimate

- [x] Small — < half a day
