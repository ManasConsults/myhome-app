# Finance — Budgets, Expenses, Income, Loans

## Budgets

Budgets set a spending limit for a category over a defined period.

**`Budget` type:**
```ts
type Budget = {
  id: string
  name: string                        // user-defined label e.g. "Groceries"
  type: "monthly" | "yearly"
  category: string                    // e.g. "Food & Dining"
  icon: string
  color: string                       // CSS var e.g. "var(--color-chart-2)"
  amount: number                      // budget limit in USD
  spent: number                       // amount used in the current period
  startDate: string                   // YYYY-MM-DD
  period: string                      // human label e.g. "April 2026" or "2026"
}
```

**Rules:**
- Progress = `spent / amount`. ≥100% → over (`text-destructive`). 80–99% → warning (`text-warning`). <80% → on track (`text-success`)
- `type: "monthly"` resets at calendar month start; `type: "yearly"` resets Jan 1
- Do not use the old `BudgetCategory` type — superseded by `Budget`

**Creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Name | string | Free text, required |
| Category | select | From canonical category list |
| Type | radio | monthly \| yearly |
| Amount | number | USD, required, > 0 |
| Event | select | Optional — only shown when group has events |

**Category list (canonical):**
Food & Dining · Utilities · Entertainment · Health & Fitness · Shopping · Transportation · Housing · Education · Travel · Personal Care

**Edit/delete pattern:**
- `BudgetList` owns `useState<Budget[]>` (initialized from `userBudgets` in `useEffect`) — does **not** read from the import directly after mount
- `editingId: string | null` — `null` = create mode, set = edit mode (form pre-filled)
- `deleteId: string | null` — when set, row replaces action icons with inline `"Delete? [Yes] [No]"` confirmation
- `handleSave()` creates or updates via `setBudgetList(prev => prev.map(...))`
- `handleDelete(id)` filters: `setBudgetList(prev => prev.filter(b => b.id !== id))`

---

## Expenses

Individual spending entries, one-off or recurring.

**`Expense` type:**
```ts
type Expense = {
  id: string
  title: string
  amount: number                       // positive USD
  category: string
  icon: string
  date: string                         // YYYY-MM-DD
  recurring: boolean
  frequency?: "weekly" | "fortnightly" | "monthly" | "yearly"
  nextDate?: string                    // YYYY-MM-DD
  budgetId?: string
  groupId: string
  eventId?: string
}
```

**Rules:**
- `amount` always positive
- `frequency` and `nextDate` only present when `recurring: true`
- `nextDate` computed from `date` + `frequency` — store it, don't derive in render
- Category uses same canonical list as Budgets

**Creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Title | string | Free text, required |
| Amount | number | USD, required, > 0 |
| Category | select | Canonical category list |
| Date | date | Defaults to today |
| Recurring | toggle | Off by default |
| Frequency | select | Only shown when Recurring on: weekly \| fortnightly \| monthly \| yearly |

**Display rules:**
- Recurring tab: `recurring: true` only, sorted by `nextDate`
- One-off tab: `recurring: false` only, sorted by `date` desc
- All tab: combined, sorted by `date` desc
- Frequency badge colours: weekly → `bg-primary/10 text-primary`, fortnightly → `bg-warning/10 text-warning`, monthly → `bg-success/10 text-success`, yearly → `bg-muted text-muted-foreground`

**Edit/delete pattern:**
- `ExpenseList` owns `useState<Expense[]>` (initialized via `useEffect` scope reset)
- `editingId: string | null`, `deleteId: string | null` — same inline confirmation pattern
- On save: update `frequency`/`nextDate` from edited values; clear them when switching to non-recurring
- `handleDelete(id)`: `setExpenses(prev => prev.filter(ex => ex.id !== id))`

---

## Income

Money coming in — recurring (salary, rental) or one-off (freelance, bonus).

**`Income` type:**
```ts
type Income = {
  id: string
  title: string
  amount: number                       // positive USD
  category: string
  icon: string
  date: string                         // YYYY-MM-DD
  recurring: boolean
  frequency?: "weekly" | "fortnightly" | "monthly" | "yearly"
  nextDate?: string                    // YYYY-MM-DD
  groupId: string
  eventId?: string
}
```

**Rules:**
- `amount` always positive
- Amount displayed in `text-success` to distinguish from expenses
- Same frequency badge colours as Expenses

**Income category list (canonical):**
Salary · Freelance · Rental Income · Investment · Business Income · Government Benefits · Gift · Other

**Creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Title | string | Free text, required |
| Amount | number | USD, required, > 0 |
| Category | select | Income category list |
| Date | date | Defaults to today |
| Recurring | toggle | Off by default |
| Frequency | select | Only shown when Recurring on |

**Edit/delete pattern:**
- `IncomeList` owns `useState<Income[]>` (initialized via `useEffect` scope reset)
- Same `editingId` / `deleteId` pattern as Expenses
- `handleDelete(id)`: `setIncomes(prev => prev.filter(inc => inc.id !== id))`

---

## Loans

Tracks money lent to others and borrowed from others, with optional interest and repayment history.

**`Loan` type:**
```ts
type Loan = {
  id: string
  direction: "lent" | "borrowed"  // "lent" = they owe me; "borrowed" = I owe them
  contact: string
  principal: number                // original amount in USD
  interestRate: number             // annual simple interest % (0 = interest-free)
  startDate: string                // YYYY-MM-DD
  dueDate?: string
  notes?: string
  groupId: string
  eventId?: string
}
```

**`LoanRepayment` type:**
```ts
type LoanRepayment = {
  id: string
  loanId: string
  amount: number
  date: string                     // YYYY-MM-DD
  note?: string
}
```

**Outstanding balance (computed on render, never stored):**
```ts
const days = (new Date(TODAY) - new Date(loan.startDate)) / 86_400_000
const interest = loan.principal * (loan.interestRate / 100) * (days / 365)
const totalRepaid = repayments.filter(r => r.loanId === loan.id).reduce((s, r) => s + r.amount, 0)
const outstanding = Math.max(0, loan.principal + interest - totalRepaid)
```

**Loan status:**
- `settled` — outstanding === 0
- `overdue` — dueDate < TODAY && outstanding > 0
- `active` — otherwise

**Badge colours:**
- Status: active → `bg-success/10 text-success` · settled → `bg-muted text-muted-foreground` · overdue → `bg-destructive/10 text-destructive`
- Direction: lent → `bg-primary/10 text-primary` · borrowed → `bg-warning/10 text-warning`

**Loan creation form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Direction | segmented control | "I lent" \| "I borrowed" — side by side |
| Contact | string | Required |
| Amount | number | USD, required, > 0 |
| Interest rate | number | Annual %, default 0 |
| Start date | date | Required, defaults to today |
| Due date | date | Optional |
| Notes | string | Optional |
| Event | select | Optional — only shown when group has events |

**Repayment form fields (inline, per loan):**
| Field | Type | Notes |
|-------|------|-------|
| Amount | number | USD, required, > 0 |
| Date | date | Required, defaults to today |
| Note | string | Optional |

**Display rules:**
- Tabs: All / Lent / Borrowed
- Settled loans hidden by default — "Show settled" toggle reveals them
- Each loan row expands to show: principal, interest, total repaid, repayment history, add-repayment form
- Stats: Lent Out (outstanding for lent), You Owe (outstanding for borrowed), Overdue (count), Settled (count)
- `LoanList` receives `onAddRepayment`, `onEdit`, `onDelete` callbacks — mutations flow up to `LoansSection`
- `LoansSection` owns all state (`loanList`, `repayments`, `editingId`)

**Edit/delete pattern:**
- `editingId: string | null` lives in `LoansSection` — `null` = create, set = edit (form pre-filled)
- `deleteId: string | null` lives in `LoanList` — inline "Delete? Yes / No" per card; confirmed calls `onDelete(id)`
- Card header row: flex-1 expand button (left) + right-side div with outstanding, action buttons, chevron — buttons use `e.stopPropagation()`
- `handleDelete(id)` removes the loan **and** all its repayments: `setRepayments(prev => prev.filter(r => r.loanId !== id))`
