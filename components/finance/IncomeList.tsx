"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, RefreshCw, Calendar, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils"
import { type Income, type Category } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { EventFilter } from "@/components/ui/EventFilter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getIncomes, createIncome, updateIncome, deleteIncome } from "@/lib/actions/finance"

type Tab = "all" | "recurring" | "one-off"
type Frequency = "weekly" | "fortnightly" | "monthly" | "yearly"
type SortKey = "updatedAt" | "createdAt" | "date" | "amount"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
]


const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

const FREQUENCY_BADGE: Record<Frequency, string> = {
  weekly: "bg-primary/10 text-primary",
  fortnightly: "bg-warning/10 text-warning",
  monthly: "bg-success/10 text-success",
  yearly: "bg-muted text-muted-foreground",
}

function frequencyLabel(f: Frequency) {
  return FREQUENCY_OPTIONS.find((o) => o.value === f)?.label ?? f
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function fmtDate(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`
}

function computeNextDate(date: string, frequency: Frequency): string {
  const d = new Date(date)
  switch (frequency) {
    case "weekly":      d.setDate(d.getDate() + 7);        break
    case "fortnightly": d.setDate(d.getDate() + 14);       break
    case "monthly":     d.setMonth(d.getMonth() + 1);      break
    case "yearly":      d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().slice(0, 10)
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.2, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

export function IncomeList({ incomeCategories }: { incomeCategories: Category[] }) {
  const iconMap = Object.fromEntries(incomeCategories.map((c) => [c.name, c.icon]))
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events } = useGroup()
  const queryClient = useQueryClient()
  const currency = activeGroup.currency
  const formCardRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>("all")
  const [sortBy, setSortBy] = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: incomes = [] } = useQuery({
    queryKey: ["incomes", activeGroup.id, activeEvent?.id ?? null],
    queryFn: () => getIncomes(activeGroup.id, activeEvent?.id),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["incomes", activeGroup.id] })
  const createMutation = useMutation({ mutationFn: createIncome, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Income, "id" | "createdAt" | "updatedAt">> }) =>
      updateIncome(id, data),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteIncome, onSuccess: invalidate })

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(() => incomeCategories[0]?.name ?? "")
  const [date, setDate] = useState("")
  useEffect(() => { setDate(new Date().toISOString().slice(0, 10)) }, [])
  const [recurring, setRecurring] = useState(false)
  const [frequency, setFrequency] = useState<Frequency>("monthly")
  const [eventId, setEventId] = useState<string>(activeEvent?.id ?? "")
  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const filtered = incomes
    .filter((e) => {
      if (tab === "recurring") return e.recurring
      if (tab === "one-off") return !e.recurring
      return true
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortBy === "updatedAt") return a.updatedAt < b.updatedAt ? -dir : dir
      if (sortBy === "createdAt") return a.createdAt < b.createdAt ? -dir : dir
      if (sortBy === "amount") return dir * (a.amount - b.amount)
      // date
      if (tab === "recurring") {
        const aD = a.nextDate ?? a.date, bD = b.nextDate ?? b.date
        return aD < bD ? -dir : dir
      }
      return a.date < b.date ? -dir : dir
    })

  function resetForm() {
    setTitle("")
    setAmount("")
    setCategory(incomeCategories[0]?.name ?? "")
    setDate(new Date().toISOString().slice(0, 10))
    setRecurring(false)
    setFrequency("monthly")
    setEventId(activeEvent?.id ?? "")
  }

  function openCreate() {
    setEditingId(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(income: Income) {
    setEditingId(income.id)
    setTitle(income.title)
    setAmount(String(income.amount))
    setCategory(income.category)
    setDate(income.date)
    setRecurring(income.recurring)
    setFrequency(income.frequency ?? "monthly")
    setEventId(income.eventId ?? "")
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
    const parsed = parseFloat(amount)
    if (!title.trim() || isNaN(parsed) || parsed <= 0) return

    const shared = {
      title: title.trim(),
      amount: parsed,
      category,
      icon: iconMap[category] ?? "💰",
      date,
      recurring,
      ...(eventId ? { eventId } : { eventId: undefined }),
      ...(recurring
        ? { frequency, nextDate: computeNextDate(date, frequency) }
        : { frequency: undefined, nextDate: undefined }),
    }

    if (editingId) {
      const result = await updateMutation.mutateAsync({ id: editingId, data: shared })
      if (result.success) closeForm()
    } else {
      const result = await createMutation.mutateAsync({
        ...shared,
        groupId: activeGroup.id,
        ...(recurring ? {} : { frequency: undefined, nextDate: undefined }),
      })
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
    setDeleteId(null)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "recurring", label: "Recurring" },
    { key: "one-off", label: "One-off" },
  ]

  return (
    <Card ref={formCardRef}>
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Income</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs"
            onClick={() => (showForm ? closeForm() : openCreate())}
          >
            {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showForm ? "Cancel" : "Add income"}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t.label}
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
        {groupEvents.length > 0 && (
          <div className="mt-2">
            <EventFilter
              events={groupEvents}
              activeEvent={activeEvent}
              onSelect={(id) => id ? setActiveEvent(id) : clearActiveEvent()}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <AnimatePresence>
          {showForm && (
            <motion.form
              key="income-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="overflow-hidden border-b border-border/60"
            >
              <div className="p-4 flex flex-col gap-3">
                <p className="text-sm font-medium">{editingId ? "Edit income" : "New income"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly salary"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
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
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="h-9 pl-7 pr-3 w-full rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {incomeCategories.map((c) => (
                        <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={recurring}
                    onClick={() => setRecurring((v) => !v)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      recurring ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                        recurring ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                  <span className="text-sm font-medium">Recurring</span>

                  <AnimatePresence>
                    {recurring && (
                      <motion.select
                        key="freq"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as Frequency)}
                        className="h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 ml-auto"
                      >
                        {FREQUENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </motion.select>
                    )}
                  </AnimatePresence>
                </div>

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
                        <option key={ev.id} value={ev.id}>
                          {ev.icon} {ev.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" size="sm">
                    {editingId ? "Save changes" : "Add income"}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.ul
            key={tab}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="divide-y divide-border/50"
          >
            {filtered.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">
                No {tab === "recurring" ? "recurring" : tab === "one-off" ? "one-off" : ""} income yet.
              </li>
            ) : (
              filtered.map((income, i) => {
                const isDeleting = deleteId === income.id
                return (
                  <motion.li
                    key={income.id}
                    custom={i}
                    variants={itemVariants}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="size-9 rounded-lg bg-success/10 flex items-center justify-center text-base shrink-0">
                      {income.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{income.title}</p>
                        {income.recurring && income.frequency && (
                          <span
                            className={cn(
                              "shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none flex items-center gap-1",
                              FREQUENCY_BADGE[income.frequency]
                            )}
                          >
                            <RefreshCw className="size-2.5" />
                            {frequencyLabel(income.frequency)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{income.category}</span>
                        {income.recurring && income.nextDate && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="size-3" />
                              Next {fmtDate(income.nextDate)}
                            </span>
                          </>
                        )}
                        {!income.recurring && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground">
                              {fmtDate(income.date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-success">
                        +{formatCurrency(income.amount, currency)}
                      </p>

                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Delete?</span>
                          <button
                            onClick={() => handleDelete(income.id)}
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
                            onClick={() => openEdit(income)}
                            className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Edit income"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(income.id)}
                            className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Delete income"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.li>
                )
              })
            )}
          </motion.ul>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
