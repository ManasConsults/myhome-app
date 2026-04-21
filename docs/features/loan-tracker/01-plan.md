# Feature Plan: Loan Tracker

**Date:** 2026-04-07
**Status:** DRAFT
**Feature slug:** loan-tracker

---

## Problem Statement

Users need to track money they've lent to others (with optional interest) and money they owe to others. Today there's no way to record these informal loans, monitor outstanding balances, or log repayments — leading to forgotten debts and lost money.

## Proposed Solution

A Loan Tracker section under Finance. Users can log two types of loans: money they lent out (they are the lender) and money they borrowed (they are the borrower). Each loan has an optional interest rate, a start date, and an optional due date. Repayments can be logged against any loan — either partial instalments or a full lump-sum — reducing the outstanding balance over time. The section shows a clear summary of what's owed to the user vs. what the user owes, with per-loan repayment history.

## User Stories

- As a user, I want to record a loan I gave someone so I can track what they owe me and when it's due
- As a user, I want to set an interest rate on a loan so the outstanding amount reflects interest accrued
- As a user, I want to log a repayment (partial or full) against a loan so my records stay accurate
- As a user, I want to record money I borrowed from someone so I know what I owe and to whom
- As a user, I want to see a summary of total lent vs. total borrowed and overall outstanding balances

## Acceptance Criteria

- [ ] Can create a "lent" loan: contact name, amount, interest rate (0% allowed), start date, optional due date, optional notes
- [ ] Can create a "borrowed" loan: same fields but direction is reversed
- [ ] Outstanding balance = principal + accrued interest − sum of repayments
- [ ] Can log a repayment against any loan: amount, date, optional note
- [ ] Loans show status: Active (balance > 0), Settled (balance = 0), Overdue (due date passed, balance > 0)
- [ ] Stats cards: Total Lent, Total Borrowed, Outstanding (net), Overdue count
- [ ] All loans are scoped to `groupId`; optionally tagged to an event
- [ ] Works with EventFilter like all other feature sections

## Out of Scope

- Compound interest — simple interest only (principal × rate × time in years)
- Reminders / notifications
- Multi-currency
- Shared/split loans between multiple people

## Risks & Open Questions

- **Interest calculation**: Simple interest only for now — `interest = principal × (rate/100) × (daysSinceStart / 365)`. Outstanding = principal + interest − totalRepaid. This is always recomputed on render from the loan's start date.
- **Repayment allocation**: Repayments reduce outstanding balance (interest first, then principal) — or simpler: just reduce total outstanding without explicit allocation. Simpler is better for now.
- **Negative outstanding**: If total repaid > principal + interest, treat outstanding as 0 (overpaid, show as settled)

## Complexity Estimate

- [ ] Small — < half a day
- [x] Medium — 1–2 days
- [ ] Large — 3+ days
