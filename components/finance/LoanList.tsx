"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus, X, User, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils"
import { type Loan, type LoanRepayment } from "@/lib/types"

const TODAY = new Date().toISOString().slice(0, 10)

type Tab = "all" | "lent" | "borrowed"
type LoanStatus = "active" | "settled" | "overdue"
type LoanSortKey = "updatedAt" | "createdAt" | "amount"
type RepSortKey  = "updatedAt" | "createdAt" | "date" | "amount"

const LOAN_SORT_OPTIONS: { key: LoanSortKey; label: string }[] = [
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
  { key: "amount",    label: "Amount" },
]

const REP_SORT_OPTIONS: { key: RepSortKey; label: string }[] = [
  { key: "date",      label: "Date" },
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
  { key: "amount",    label: "Amount" },
]

function calcOutstanding(loan: Loan, repayments: LoanRepayment[]) {
  const days = Math.max(0, (new Date(TODAY).getTime() - new Date(loan.startDate).getTime()) / 86_400_000)
  const interest = loan.principal * (loan.interestRate / 100) * (days / 365)
  const totalRepaid = repayments
    .filter((r) => r.loanId === loan.id)
    .reduce((s, r) => s + r.amount, 0)
  const outstanding = Math.max(0, loan.principal + interest - totalRepaid)
  return { interest, outstanding, totalRepaid }
}

function getLoanStatus(loan: Loan, outstanding: number): LoanStatus {
  if (outstanding === 0) return "settled"
  if (loan.dueDate && loan.dueDate < TODAY) return "overdue"
  return "active"
}

const STATUS_STYLES: Record<LoanStatus, string> = {
  active:  "bg-success/10 text-success",
  settled: "bg-muted text-muted-foreground",
  overdue: "bg-destructive/10 text-destructive",
}

const DIRECTION_STYLES = {
  lent:     "bg-primary/10 text-primary",
  borrowed: "bg-warning/10 text-warning",
}

interface LoanListProps {
  loans: Loan[]
  repayments: LoanRepayment[]
  currency: string
  onAddRepayment: (rep: Omit<LoanRepayment, "id" | "createdAt" | "updatedAt">) => void
  onEdit: (loan: Loan) => void
  onDelete: (id: string) => void
}

export function LoanList({ loans, repayments, currency, onAddRepayment, onEdit, onDelete }: LoanListProps) {
  const [tab, setTab] = useState<Tab>("all")
  const [showSettled, setShowSettled] = useState(false)
  const [sortBy, setSortBy] = useState<LoanSortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [repSortBy, setRepSortBy] = useState<RepSortKey>("date")
  const [repSortDir, setRepSortDir] = useState<"asc" | "desc">("desc")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [repFormId, setRepFormId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [repAmount, setRepAmount] = useState("")
  const [repDate, setRepDate] = useState("")
  const [repNote, setRepNote] = useState("")

  useEffect(() => { setRepDate(new Date().toISOString().slice(0, 10)) }, [])

  function openRepForm(loanId: string) {
    setRepFormId(loanId)
    setRepAmount("")
    setRepNote("")
  }

  function handleAddRepayment(e: React.FormEvent, loan: Loan) {
    e.preventDefault()
    const amount = parseFloat(repAmount)
    if (!amount || amount <= 0 || !repDate) return
    onAddRepayment({ loanId: loan.id, amount, date: repDate, ...(repNote.trim() ? { note: repNote.trim() } : {}) })
    setRepFormId(null)
    setRepAmount("")
    setRepNote("")
  }

  const filtered = loans
    .map((loan) => {
      const { interest, outstanding, totalRepaid } = calcOutstanding(loan, repayments)
      const status = getLoanStatus(loan, outstanding)
      return { loan, interest, outstanding, totalRepaid, status }
    })
    .filter(({ loan, status }) => {
      if (tab !== "all" && loan.direction !== tab) return false
      if (!showSettled && status === "settled") return false
      return true
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortBy === "updatedAt") return a.loan.updatedAt < b.loan.updatedAt ? -dir : dir
      if (sortBy === "createdAt") return a.loan.createdAt < b.loan.createdAt ? -dir : dir
      if (sortBy === "amount") return dir * (a.loan.principal - b.loan.principal)
      return 0
    })

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "lent", label: "Lent" },
    { key: "borrowed", label: "Borrowed" },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar — tabs / sort / show settled */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Sort:</span>
            {LOAN_SORT_OPTIONS.map((s) => {
              const active = sortBy === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    if (active) {
                      setSortDir((d) => d === "asc" ? "desc" : "asc")
                    } else {
                      setSortBy(s.key)
                      setSortDir("desc")
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {s.label}
                  {active && (sortDir === "asc"
                    ? <ArrowUp className="size-3" />
                    : <ArrowDown className="size-3" />
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setShowSettled((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              showSettled ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <span className={cn(
              "inline-block size-3 rounded-full border-2 transition-colors",
              showSettled ? "bg-success border-success" : "border-muted-foreground/40"
            )} />
            Show settled
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No loans yet — tap Add loan to get started
        </p>
      )}

      {/* Loan cards */}
      {filtered.map(({ loan, interest, outstanding, totalRepaid, status }) => {
        const loanRepaymentList = repayments.filter((r) => r.loanId === loan.id)
        const isExpanded = expandedId === loan.id

        return (
          <Card key={loan.id} className="border-border/60 overflow-hidden">
            <CardContent className="p-0">
              {/* Card header row — always visible */}
              <div className="flex items-start gap-3 px-4 py-4 hover:bg-muted/30 transition-colors">
                {/* Expand button — covers left/center content */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <User className="size-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-sm">{loan.contact}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", DIRECTION_STYLES[loan.direction])}>
                        {loan.direction === "lent" ? "Lent" : "Borrowed"}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium capitalize", STATUS_STYLES[status])}>
                        {status}
                      </span>
                      {loan.dueDate && (
                        <span className={cn(
                          "text-[11px]",
                          status === "overdue" ? "text-destructive font-medium" : "text-muted-foreground"
                        )}>
                          Due {new Date(loan.dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Right: outstanding + actions + chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                    className="text-right"
                  >
                    <p className="text-lg font-bold tracking-tight">{formatCurrency(outstanding, currency)}</p>
                    <p className="text-xs text-muted-foreground">outstanding</p>
                  </button>

                  {deleteId === loan.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-muted-foreground">Delete?</span>
                      <button
                        onClick={() => { onDelete(loan.id); setDeleteId(null) }}
                        className="px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(loan) }}
                        className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Edit loan"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(loan.id) }}
                        className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Delete loan"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                  >
                    <ChevronDown className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )} />
                  </button>
                </div>
              </div>

              {/* Expanded detail panel */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 flex flex-col gap-4 border-t border-border/50 pt-4 bg-muted/20">

                      {/* Breakdown */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Principal</p>
                          <p className="font-semibold text-sm">{formatCurrency(loan.principal, currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Interest{loan.interestRate > 0 ? ` (${loan.interestRate}% p.a.)` : " (0%)"}
                          </p>
                          <p className="font-semibold text-sm">{formatCurrency(interest, currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Repaid</p>
                          <p className="font-semibold text-sm text-success">{formatCurrency(totalRepaid, currency)}</p>
                        </div>
                      </div>

                      {loan.notes && (
                        <p className="text-xs text-muted-foreground italic">&quot;{loan.notes}&quot;</p>
                      )}

                      {/* Repayment history */}
                      {loanRepaymentList.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Repayments</p>
                            <div className="flex items-center gap-1">
                              {REP_SORT_OPTIONS.map((s) => {
                                const active = repSortBy === s.key
                                return (
                                  <button
                                    key={s.key}
                                    onClick={() => {
                                      if (active) {
                                        setRepSortDir((d) => d === "asc" ? "desc" : "asc")
                                      } else {
                                        setRepSortBy(s.key)
                                        setRepSortDir("desc")
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors",
                                      active
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                    )}
                                  >
                                    {s.label}
                                    {active && (repSortDir === "asc"
                                      ? <ArrowUp className="size-2.5" />
                                      : <ArrowDown className="size-2.5" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div className="flex flex-col divide-y divide-border/40 rounded-lg border border-border/50 overflow-hidden">
                            {[...loanRepaymentList]
                              .sort((a, b) => {
                                const dir = repSortDir === "asc" ? 1 : -1
                                if (repSortBy === "updatedAt") return a.updatedAt < b.updatedAt ? -dir : dir
                                if (repSortBy === "createdAt") return a.createdAt < b.createdAt ? -dir : dir
                                if (repSortBy === "date") return a.date < b.date ? -dir : dir
                                if (repSortBy === "amount") return dir * (a.amount - b.amount)
                                return 0
                              })
                              .map((r) => (
                                <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-background text-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(r.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                                    </span>
                                    {r.note && <span className="text-xs text-muted-foreground italic">{r.note}</span>}
                                  </div>
                                  <span className="font-medium text-success text-sm">{formatCurrency(r.amount, currency)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Add repayment */}
                      {status !== "settled" && (
                        repFormId !== loan.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-xs h-8 self-start"
                            onClick={() => openRepForm(loan.id)}
                          >
                            <Plus className="size-3.5" />
                            Add repayment
                          </Button>
                        ) : (
                          <AnimatePresence>
                            <motion.form
                              key="rep-form"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              onSubmit={(e) => handleAddRepayment(e, loan)}
                              className="flex flex-col gap-2"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs text-muted-foreground font-medium">Amount</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={repAmount}
                                      onChange={(e) => setRepAmount(e.target.value)}
                                      required
                                      className="h-9 pl-7 pr-3 w-full rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs text-muted-foreground font-medium">Date</label>
                                  <input
                                    type="date"
                                    value={repDate}
                                    onChange={(e) => setRepDate(e.target.value)}
                                    required
                                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground font-medium">Note (optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Partial payment"
                                  value={repNote}
                                  onChange={(e) => setRepNote(e.target.value)}
                                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button type="submit" size="sm">Add repayment</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setRepFormId(null)}>
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            </motion.form>
                          </AnimatePresence>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
