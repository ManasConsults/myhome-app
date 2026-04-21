# Feature Design: Loan Tracker

**Date:** 2026-04-07
**Status:** DRAFT
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

Lives under Finance as a new sub-page (`/finance/loans`). Follows the established Section component pattern — RSC shell page + client `LoansSection` that owns all state.

Two data types: `Loan` (the loan record) and `LoanRepayment` (individual payment against a loan). Both live in `lib/dummy-data.ts` for now. Outstanding balance is **computed on render** from principal + accrued simple interest − sum of repayments; it is never stored.

The `LoanList` display component is a shared read-only widget (like `TaskList`, `ShoppingList`). The add-loan form and add-repayment form both live in `LoansSection`.

---

## Route Structure

| Route | File | Type | Notes |
|-------|------|------|-------|
| `/finance/loans` | `app/(dashboard)/finance/loans/page.tsx` | RSC | Shell — renders `<LoansSection />` |

Finance sub-nav gains a "Loans" entry in Sidebar.tsx and MobileNav.tsx.

---

## Data Model

### New types (add to `lib/dummy-data.ts`)

```ts
export type Loan = {
  id: string
  direction: "lent" | "borrowed"  // "lent" = they owe me; "borrowed" = I owe them
  contact: string                  // person's name
  principal: number                // original amount in USD
  interestRate: number             // annual simple interest % (0 = interest-free)
  startDate: string                // YYYY-MM-DD
  dueDate?: string                 // YYYY-MM-DD — optional
  notes?: string
  groupId: string
  eventId?: string
}

export type LoanRepayment = {
  id: string
  loanId: string
  amount: number
  date: string                     // YYYY-MM-DD
  note?: string
}
```

### Outstanding balance calculation (utility, not stored)

```ts
function calcOutstanding(loan: Loan, repayments: LoanRepayment[]) {
  const days = Math.max(0,
    (Date.now() - new Date(loan.startDate).getTime()) / 86_400_000
  )
  const interest = loan.principal * (loan.interestRate / 100) * (days / 365)
  const totalRepaid = repayments
    .filter((r) => r.loanId === loan.id)
    .reduce((s, r) => s + r.amount, 0)
  const outstanding = Math.max(0, loan.principal + interest - totalRepaid)
  return { interest, outstanding, totalRepaid }
}
```

### Loan status

```ts
type LoanStatus = "active" | "settled" | "overdue"

function getLoanStatus(loan: Loan, outstanding: number): LoanStatus {
  if (outstanding === 0) return "settled"
  if (loan.dueDate && loan.dueDate < TODAY) return "overdue"
  return "active"
}
```

### Dummy data additions

**4 loans for g1:**

| id | direction | contact | principal | rate | startDate | dueDate |
|----|-----------|---------|-----------|------|-----------|---------|
| loan-1 | lent | Alex | 500 | 0 | 2026-01-15 | 2026-06-15 |
| loan-2 | lent | Sam | 1200 | 5 | 2025-11-01 | 2026-05-01 |
| loan-3 | borrowed | Mum | 3000 | 0 | 2026-02-01 | — |
| loan-4 | borrowed | Bank of Friends | 800 | 8 | 2025-09-01 | 2026-03-01 (overdue) |

**Repayments:**

| id | loanId | amount | date |
|----|--------|--------|------|
| rep-1 | loan-1 | 200 | 2026-02-10 |
| rep-2 | loan-2 | 400 | 2026-03-01 |
| rep-3 | loan-4 | 800 | 2026-03-15 (settles loan-4) |

---

## Component Design

| Component | File | Type | Notes |
|-----------|------|------|-------|
| `LoansSection` | `components/finance/LoansSection.tsx` | Client | Owns all state; add-loan form + add-repayment form |
| `LoanList` | `components/finance/LoanList.tsx` | Client | Display widget — expandable rows + inline repayment history |

### Component hierarchy

```
app/(dashboard)/finance/loans/page.tsx  (RSC)
  └── LoansSection  (Client)
        ├── Stats cards (inline — 4 cards)
        ├── EventFilter
        ├── Card → animated add-loan form
        └── LoanList  (Client — receives data prop)
              └── per-loan expandable row
                    ├── loan summary line
                    ├── AnimatePresence → repayment history list
                    └── AnimatePresence → add-repayment form
```

---

## State Management

**`LoansSection` state:**
```ts
const [loanList, setLoanList]         = useState<Loan[]>([])
const [repayments, setRepayments]     = useState<LoanRepayment[]>([])
const [showForm, setShowForm]         = useState(false)
// add-loan form fields:
const [direction, setDirection]       = useState<"lent"|"borrowed">("lent")
const [contact, setContact]           = useState("")
const [principal, setPrincipal]       = useState("")
const [interestRate, setInterestRate] = useState("0")
const [startDate, setStartDate]       = useState("")   // hydrated via useEffect
const [dueDate, setDueDate]           = useState("")
const [notes, setNotes]               = useState("")
const [eventId, setEventId]           = useState("")
```

**`LoanList` state (per-row):**
```ts
// expandedId — which loan row is expanded (null = all collapsed)
// repaymentFormId — which loan has the add-repayment form open
// repayment form fields: amount, date, note
```

`LoanList` receives `loans`, `repayments`, and an `onAddRepayment` callback from `LoansSection` — keeping mutations in the parent.

**Scope reset:**
```ts
useEffect(() => {
  const nextLoans = activeEvent
    ? initialLoans.filter((l) => l.eventId === activeEvent.id)
    : initialLoans.filter((l) => l.groupId === activeGroup.id)
  setLoanList(nextLoans)
  // repayments for the visible loans only
  const ids = new Set(nextLoans.map((l) => l.id))
  setRepayments(initialRepayments.filter((r) => ids.has(r.loanId)))
}, [activeGroup.id, activeEvent?.id])
```

---

## Key UI Decisions

**Stats cards (4):**
| Label | Value | Color |
|-------|-------|-------|
| Total Lent | sum of principals (direction=lent) | text-primary |
| Total Borrowed | sum of principals (direction=borrowed) | text-destructive |
| Outstanding | net outstanding (lent − borrowed) | text-warning |
| Overdue | count of overdue loans | text-destructive |

**Loan list — tabs:** All · Lent · Borrowed (filter bar, same pattern as expenses)

**Loan row (collapsed):**
```
[👤 Alex]  [Lent]  [Active]          $500 principal
                                      +$0 interest
                                      $300 outstanding   ↓
```

**Loan row (expanded):**
```
[👤 Alex]  [Lent]  [Active]          $500 principal
                                      +$0 interest
                                      $300 outstanding   ↑
  ─────────────────────────────────────────────────────
  Repayments
  Feb 10, 2026   $200                 [No note]
  ─────────────────────────────────────────────────────
  [+ Add repayment]
    amount | date | note (optional)   [Add]
```

**Status badges:**
- Active → `bg-success/10 text-success`
- Settled → `bg-muted text-muted-foreground`
- Overdue → `bg-destructive/10 text-destructive`

**Direction pills:**
- Lent → `bg-primary/10 text-primary`
- Borrowed → `bg-warning/10 text-warning`

**Empty state:** "No loans yet — tap Add loan to get started"

**Settled loans:** shown normally in list, status badge makes it clear. No filtering out.

---

## shadcn/ui Components Needed

None new — all existing primitives are sufficient.

---

## Animations

- Add-loan form: same `height: 0 → "auto"` AnimatePresence as other sections
- Expand/collapse repayment panel: `height: 0 → "auto"` AnimatePresence per row
- Add-repayment form within expanded row: same animated expand

---

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|---------------|
| Create lent loan | `LoansSection` add form (direction = "lent") |
| Create borrowed loan | `LoansSection` add form (direction = "borrowed") |
| Interest rate tracking | `calcOutstanding()` — computed on render |
| Log repayment (partial/full) | `LoanList` inline add-repayment form → `onAddRepayment` callback |
| Outstanding balance display | `LoanList` row — shows principal, interest, outstanding separately |
| Loan status | `getLoanStatus()` — badge in each row |
| Stats cards | Inline in `LoansSection` |
| Group/event scope | `useEffect` reset + EventFilter bar |

---

## Files to Create

- `app/(dashboard)/finance/loans/page.tsx`
- `components/finance/LoansSection.tsx`
- `components/finance/LoanList.tsx`

## Files to Modify

- `lib/dummy-data.ts` — add `Loan`, `LoanRepayment` types + dummy entries
- `components/layout/Sidebar.tsx` — add Loans to Finance sub-nav
- `components/layout/MobileNav.tsx` — same
- `CLAUDE.md` — add Loan domain model to Domain Models section
