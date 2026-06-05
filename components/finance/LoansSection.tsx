"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils"
import { type Loan, type LoanRepayment } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { LoanList } from "@/components/finance/LoanList"
import { EventFilter } from "@/components/ui/EventFilter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getLoans, createLoan, updateLoan, deleteLoan, getRepaymentsByGroup, createRepayment } from "@/lib/actions/finance"

function calcOutstanding(loan: Loan, repayments: LoanRepayment[]) {
  const today = new Date().toISOString().slice(0, 10)
  const days = Math.max(0, (new Date(today).getTime() - new Date(loan.startDate).getTime()) / 86_400_000)
  const interest = loan.principal * (loan.interestRate / 100) * (days / 365)
  const totalRepaid = repayments.filter((r) => r.loanId === loan.id).reduce((s, r) => s + r.amount, 0)
  return Math.max(0, loan.principal + interest - totalRepaid)
}

function isOverdue(loan: Loan, outstanding: number) {
  const today = new Date().toISOString().slice(0, 10)
  return outstanding > 0 && !!loan.dueDate && loan.dueDate < today
}

export function LoansSection() {
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events } = useGroup()
  const queryClient = useQueryClient()
  const currency = activeGroup.currency

  const formCardRef = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [direction, setDirection] = useState<"lent" | "borrowed">("lent")
  const [contact, setContact] = useState("")
  const [principal, setPrincipal] = useState("")
  const [interestRate, setInterestRate] = useState("0")
  const [startDate, setStartDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [eventId, setEventId] = useState("")

  useEffect(() => { setStartDate(new Date().toISOString().slice(0, 10)) }, [])
  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const { data: loanList = [] } = useQuery({
    queryKey: ["loans", activeGroup.id, activeEvent?.id ?? null],
    queryFn: () => getLoans(activeGroup.id, activeEvent?.id),
  })

  const { data: repayments = [] } = useQuery({
    queryKey: ["repayments", activeGroup.id],
    queryFn: () => getRepaymentsByGroup(activeGroup.id),
  })

  const invalidateLoans = () => queryClient.invalidateQueries({ queryKey: ["loans", activeGroup.id] })
  const invalidateRepayments = () => queryClient.invalidateQueries({ queryKey: ["repayments", activeGroup.id] })

  const createMutation = useMutation({ mutationFn: createLoan, onSuccess: invalidateLoans })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Loan, "id" | "createdAt" | "updatedAt">> }) =>
      updateLoan(id, data),
    onSuccess: invalidateLoans,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteLoan,
    onSuccess: () => { invalidateLoans(); invalidateRepayments() },
  })
  const repaymentMutation = useMutation({ mutationFn: createRepayment, onSuccess: invalidateRepayments })

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  // Stats
  const lentOutstanding = loanList
    .filter((l) => l.direction === "lent")
    .reduce((s, l) => s + calcOutstanding(l, repayments), 0)

  const borrowedOutstanding = loanList
    .filter((l) => l.direction === "borrowed")
    .reduce((s, l) => s + calcOutstanding(l, repayments), 0)

  const overdueCount = loanList.filter((l) => isOverdue(l, calcOutstanding(l, repayments))).length

  const settledCount = loanList.filter((l) => calcOutstanding(l, repayments) === 0).length

  const statsData = [
    { label: "Lent Out",     value: formatCurrency(lentOutstanding, currency, 0),     icon: TrendingUp,    color: "text-primary",     bg: "bg-primary/10" },
    { label: "You Owe",      value: formatCurrency(borrowedOutstanding, currency, 0), icon: TrendingDown,  color: "text-destructive",  bg: "bg-destructive/10" },
    { label: "Overdue",      value: overdueCount,                          icon: AlertTriangle, color: "text-warning",     bg: "bg-warning/10" },
    { label: "Settled",      value: settledCount,                          icon: CheckCircle2,  color: "text-success",     bg: "bg-success/10" },
  ]

  function resetForm() {
    setDirection("lent")
    setContact("")
    setPrincipal("")
    setInterestRate("0")
    setStartDate(new Date().toISOString().slice(0, 10))
    setDueDate("")
    setNotes("")
    setEventId(activeEvent?.id ?? "")
  }

  function openCreate() {
    setEditingId(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(loan: Loan) {
    setEditingId(loan.id)
    setDirection(loan.direction)
    setContact(loan.contact)
    setPrincipal(String(loan.principal))
    setInterestRate(String(loan.interestRate))
    setStartDate(loan.startDate)
    setDueDate(loan.dueDate ?? "")
    setNotes(loan.notes ?? "")
    setEventId(loan.eventId ?? "")
    setShowForm(true)
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(principal)
    const rate = parseFloat(interestRate)
    if (!contact.trim() || !amount || amount <= 0 || !startDate) return

    const shared = {
      direction,
      contact: contact.trim(),
      principal: amount,
      interestRate: isNaN(rate) ? 0 : Math.max(0, rate),
      startDate,
      ...(dueDate ? { dueDate } : { dueDate: undefined }),
      ...(notes.trim() ? { notes: notes.trim() } : { notes: undefined }),
      ...(eventId ? { eventId } : { eventId: undefined }),
    }

    if (editingId) {
      const result = await updateMutation.mutateAsync({ id: editingId, data: shared })
      if (result.success) closeForm()
    } else {
      const result = await createMutation.mutateAsync({ ...shared, groupId: activeGroup.id })
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
  }

  async function handleAddRepayment(rep: Omit<LoanRepayment, "id" | "createdAt" | "updatedAt">) {
    await repaymentMutation.mutateAsync(rep)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsData.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <div className={cn("size-7 rounded-lg flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("size-3.5", s.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {groupEvents.length > 0 && (
        <EventFilter
          events={groupEvents}
          activeEvent={activeEvent}
          onSelect={(id) => id ? setActiveEvent(id) : clearActiveEvent()}
        />
      )}

      <Card ref={formCardRef} className="border-border/60">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Loans</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => (showForm ? closeForm() : openCreate())}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "Add loan"}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showForm && (
            <motion.form
              key="loan-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3 border-b border-border/60">
                <p className="text-sm font-medium">{editingId ? "Edit loan" : "New loan"}</p>

                {/* Direction — segmented control */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Direction</label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted">
                    {(["lent", "borrowed"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDirection(d)}
                        className={cn(
                          "h-8 rounded-md text-sm font-medium transition-colors",
                          direction === d
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {d === "lent" ? "I lent" : "I borrowed"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact + Principal */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">
                      {direction === "lent" ? "Lent to" : "Borrowed from"}
                    </label>
                    <input
                      type="text"
                      placeholder="Contact name"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={principal}
                        onChange={(e) => setPrincipal(e.target.value)}
                        required
                        className="h-9 pl-7 pr-3 w-full rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Interest rate + Start date + Due date */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Interest (% p.a.)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Due date (opt.)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. For car repairs"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Event (optional) */}
                {groupEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Event (optional)</label>
                    <select
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">No event</option>
                      {groupEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.icon} {ev.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" size="sm">
                    {editingId ? "Save changes" : "Add loan"}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <LoanList
        loans={loanList}
        repayments={repayments}
        currency={currency}
        onAddRepayment={handleAddRepayment}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    </>
  )
}
