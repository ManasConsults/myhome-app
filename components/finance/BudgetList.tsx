"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils"
import { type Budget, type Category } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBudgets, getBudgetsByEvent, createBudget, updateBudget, deleteBudget } from "@/lib/actions/finance"

type TabType = "monthly" | "yearly"
type SortKey = "updatedAt" | "createdAt" | "amount" | "spent"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
  { key: "amount", label: "Amount" },
  { key: "spent", label: "Spent" },
]


function getStatusClasses(spent: number, amount: number) {
  const ratio = spent / amount
  if (ratio >= 1.0) return { text: "text-destructive", bg: "bg-destructive/10", bar: "bg-destructive" }
  if (ratio >= 0.8)  return { text: "text-warning",     bg: "bg-warning/10",     bar: "bg-warning"     }
  return { text: "text-success", bg: "bg-success/10", bar: "bg-success" }
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const rowVariants = {
  hidden:   { opacity: 0, y: 10 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
}

type FormState = {
  name: string
  category: string
  type: TabType
  amount: string
  eventId: string
}

export function BudgetList({ expenseCategories }: { expenseCategories: Category[] }) {
  const EMPTY_FORM: FormState = { name: "", category: expenseCategories[0]?.name ?? "", type: "monthly", amount: "", eventId: "" }
  const { activeGroup, activeEvent, events, isSharedEvent, activeEventGroupId } = useGroup()
  const queryClient = useQueryClient()
  const currency = activeGroup.currency
  const formCardRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab]     = useState<TabType>("monthly")
  const [sortBy, setSortBy]           = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("desc")
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [form, setForm]               = useState<FormState>(EMPTY_FORM)

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const { data: budgetList = [] } = useQuery({
    queryKey: isSharedEvent && activeEvent
      ? ["budgets", "event", activeEvent.id]
      : ["budgets", activeGroup.id, activeEvent?.id ?? null],
    queryFn: isSharedEvent && activeEvent
      ? () => getBudgetsByEvent(activeEvent.id)
      : () => getBudgets(activeGroup.id, activeEvent?.id),
  })

  const budgetsQueryKey = isSharedEvent && activeEvent
    ? ["budgets", "event", activeEvent.id]
    : ["budgets", activeGroup.id, activeEvent?.id ?? null]
  const invalidate = () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey })
  const createMutation = useMutation({ mutationFn: createBudget, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Budget, "id" | "createdAt" | "updatedAt">> }) =>
      updateBudget(id, data),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteBudget, onSuccess: invalidate })

  useEffect(() => {
    setForm((f) => ({ ...f, eventId: activeEvent?.id ?? "" }))
  }, [activeEvent?.id])

  const filtered = budgetList
    .filter((b) => b.type === activeTab)
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortBy === "updatedAt") return a.updatedAt < b.updatedAt ? -dir : dir
      if (sortBy === "createdAt") return a.createdAt < b.createdAt ? -dir : dir
      if (sortBy === "amount") return dir * (a.amount - b.amount)
      if (sortBy === "spent") return dir * (a.spent - b.spent)
      return 0
    })

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, type: activeTab, eventId: activeEvent?.id ?? "" })
    setShowForm(true)
  }

  function openEdit(b: Budget) {
    setEditingId(b.id)
    setForm({ name: b.name, category: b.category, type: b.type, amount: String(b.amount), eventId: b.eventId ?? "" })
    setShowForm(true)
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    const amount = parseFloat(form.amount)
    if (!form.name.trim() || !amount || amount <= 0) return

    if (editingId) {
      const result = await updateMutation.mutateAsync({
        id: editingId,
        data: {
          name: form.name.trim(),
          category: form.category,
          type: form.type,
          amount,
          ...(form.eventId ? { eventId: form.eventId } : { eventId: undefined }),
        },
      })
      if (result.success) closeForm()
    } else {
      const now = new Date().toISOString().slice(0, 10)
      const result = await createMutation.mutateAsync({
        name: form.name.trim(),
        category: form.category,
        type: form.type,
        amount,
        spent: 0,
        icon: "💰",
        color: "var(--color-chart-1)",
        startDate: now,
        period: form.type === "monthly"
          ? new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" })
          : String(new Date().getFullYear()),
        groupId: activeEventGroupId,
        ...(isSharedEvent && activeEvent ? { eventId: activeEvent.id } : form.eventId ? { eventId: form.eventId } : {}),
      })
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <Card ref={formCardRef} className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="size-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Budgets</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={openCreate} className="shrink-0">
            <Plus />
            New Budget
          </Button>
        </div>

        {/* Tab pills + Sort */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
            {(["monthly", "yearly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-150",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">Sort:</span>
            {SORT_OPTIONS.map((s) => {
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
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 flex flex-col gap-0">
        {/* Create / Edit form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="budget-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 mb-4 flex flex-col gap-3">
                <p className="text-sm font-medium">{editingId ? "Edit Budget" : "New Budget"}</p>

                <div className="flex flex-col gap-1">
                  <label htmlFor="budget-name" className="text-xs text-muted-foreground font-medium">Name</label>
                  <input
                    id="budget-name"
                    type="text"
                    placeholder="Budget name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="border border-input rounded-lg px-3 py-2 text-sm bg-background w-full focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="budget-category" className="text-xs text-muted-foreground font-medium">Category</label>
                  <select
                    id="budget-category"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="border border-input rounded-lg px-3 py-2 text-sm bg-background w-full focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {expenseCategories.map((c) => <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
                  {(["monthly", "yearly"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-150",
                        form.type === t
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t === "monthly" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="budget-amount" className="text-xs text-muted-foreground font-medium">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{getCurrencySymbol(currency)}</span>
                    <input
                      id="budget-amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      className="border border-input rounded-lg pl-7 pr-3 py-2 text-sm bg-background w-full focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {!isSharedEvent && groupEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="budget-event" className="text-xs text-muted-foreground font-medium">Event (optional)</label>
                    <select
                      id="budget-event"
                      value={form.eventId}
                      onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">No event</option>
                      {groupEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.icon} {ev.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end mt-1">
                  <Button variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
                  <Button size="sm" onClick={handleSave}>
                    {editingId ? "Save changes" : "Create Budget"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Budget list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
            className="flex flex-col gap-0"
          >
            {filtered.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <Target className="size-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No {activeTab} budgets</p>
              </div>
            ) : (
              filtered.map((b, i) => {
                const status = getStatusClasses(b.spent, b.amount)
                const pct = Math.min((b.spent / b.amount) * 100, 100)
                const isDeleting = deleteId === b.id

                return (
                  <motion.div key={b.id} variants={rowVariants}>
                    <div className="flex flex-col gap-2 py-3">
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                          {b.icon}
                        </div>

                        {/* Middle */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.category} · {b.period}</p>
                        </div>

                        {/* Right — amounts + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className={cn("text-xs font-medium", status.text)}>
                              {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency, 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">{Math.round(pct)}%</p>
                          </div>

                          {/* Edit + Delete */}
                          {isDeleting ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Delete?</span>
                              <button
                                onClick={() => handleDelete(b.id)}
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
                                onClick={() => openEdit(b)}
                                className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label="Edit budget"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(b.id)}
                                className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label="Delete budget"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", status.bar)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {i < filtered.length - 1 && <Separator />}
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
