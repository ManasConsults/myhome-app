"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, X,
  CheckSquare, ShoppingCart, StickyNote, CalendarDays,
  Receipt, Banknote, PiggyBank, HandCoins, UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"
import {
  tasks, shoppingItems, notes, calendarEvents,
  expenses, incomes, userBudgets, loans, recipes,
} from "@/lib/dummy-data"

type ResultType = "task" | "shopping" | "note" | "calendar" | "expense" | "income" | "budget" | "loan" | "recipe"

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle: string
  href: string
}

const TYPE_META: Record<ResultType, { label: string; icon: LucideIcon; color: string }> = {
  task:     { label: "Tasks",     icon: CheckSquare,    color: "text-primary" },
  shopping: { label: "Shopping",  icon: ShoppingCart,   color: "text-warning" },
  note:     { label: "Notes",     icon: StickyNote,     color: "text-success" },
  calendar: { label: "Calendar",  icon: CalendarDays,   color: "text-primary" },
  expense:  { label: "Expenses",  icon: Receipt,        color: "text-destructive" },
  income:   { label: "Income",    icon: Banknote,       color: "text-success" },
  budget:   { label: "Budgets",   icon: PiggyBank,      color: "text-warning" },
  loan:     { label: "Loans",     icon: HandCoins,      color: "text-primary" },
  recipe:   { label: "Recipes",   icon: UtensilsCrossed, color: "text-warning" },
}

const MAX_PER_GROUP = 4

function match(query: string, ...fields: (string | undefined)[]) {
  const q = query.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(q))
}

function buildResults(query: string, groupId: string): SearchResult[] {
  const q = query.trim()
  if (!q) return []

  const results: SearchResult[] = []

  // Tasks
  tasks
    .filter((t) => t.groupId === groupId && match(q, t.title, t.category))
    .slice(0, MAX_PER_GROUP)
    .forEach((t) => results.push({
      id: t.id, type: "task",
      title: t.title,
      subtitle: `${t.category} · ${t.priority} priority`,
      href: "/tasks",
    }))

  // Shopping
  shoppingItems
    .filter((i) => i.groupId === groupId && match(q, i.name, i.store, i.category))
    .slice(0, MAX_PER_GROUP)
    .forEach((i) => results.push({
      id: i.id, type: "shopping",
      title: i.name,
      subtitle: `${i.store} · ${i.category}`,
      href: "/shopping",
    }))

  // Notes
  notes
    .filter((n) => n.groupId === groupId && match(q, n.title, n.content, n.category))
    .slice(0, MAX_PER_GROUP)
    .forEach((n) => results.push({
      id: n.id, type: "note",
      title: n.title,
      subtitle: n.category,
      href: "/notes",
    }))

  // Calendar
  calendarEvents
    .filter((e) => e.groupId === groupId && match(q, e.title, e.category))
    .slice(0, MAX_PER_GROUP)
    .forEach((e) => results.push({
      id: e.id, type: "calendar",
      title: e.title,
      subtitle: `${e.date} · ${e.category}`,
      href: "/calendar",
    }))

  // Expenses
  expenses
    .filter((e) => e.groupId === groupId && match(q, e.title, e.category))
    .slice(0, MAX_PER_GROUP)
    .forEach((e) => results.push({
      id: e.id, type: "expense",
      title: e.title,
      subtitle: `$${e.amount.toFixed(2)} · ${e.category}`,
      href: "/finance/expenses",
    }))

  // Income
  incomes
    .filter((i) => i.groupId === groupId && match(q, i.title, i.category))
    .slice(0, MAX_PER_GROUP)
    .forEach((i) => results.push({
      id: i.id, type: "income",
      title: i.title,
      subtitle: `$${i.amount.toFixed(2)} · ${i.category}`,
      href: "/finance/income",
    }))

  // Budgets
  userBudgets
    .filter((b) => b.groupId === groupId && match(q, b.name, b.category))
    .slice(0, MAX_PER_GROUP)
    .forEach((b) => results.push({
      id: b.id, type: "budget",
      title: b.name,
      subtitle: `${b.category} · ${b.type}`,
      href: "/finance/budgets",
    }))

  // Loans
  loans
    .filter((l) => l.groupId === groupId && match(q, l.contact, l.notes))
    .slice(0, MAX_PER_GROUP)
    .forEach((l) => results.push({
      id: l.id, type: "loan",
      title: l.contact,
      subtitle: `${l.direction === "lent" ? "Lent" : "Borrowed"} · $${l.principal.toFixed(0)}`,
      href: "/finance/loans",
    }))

  // Recipes (not group-scoped)
  recipes
    .filter((r) => match(q, r.name, ...r.tags))
    .slice(0, MAX_PER_GROUP)
    .forEach((r) => results.push({
      id: r.id, type: "recipe",
      title: r.name,
      subtitle: `${r.mealType} · ${r.prepTime} min`,
      href: "/meals",
    }))

  return results
}

// Group results by type preserving order of first appearance
function groupResults(results: SearchResult[]) {
  const order: ResultType[] = []
  const map = new Map<ResultType, SearchResult[]>()
  for (const r of results) {
    if (!map.has(r.type)) { map.set(r.type, []); order.push(r.type) }
    map.get(r.type)!.push(r)
  }
  return order.map((type) => ({ type, items: map.get(type)! }))
}

export function GlobalSearch() {
  const router = useRouter()
  const { activeGroup } = useGroup()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const results = buildResults(query, activeGroup.id)
  const grouped = groupResults(results)

  const openSearch = useCallback(() => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery("")
  }, [])

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        open ? closeSearch() : openSearch()
      }
      if (e.key === "Escape") closeSearch()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, openSearch, closeSearch])

  function handleSelect(href: string) {
    router.push(href)
    closeSearch()
  }

  return (
    <>
      {/* Trigger — desktop: compact bar, mobile: icon */}
      <button
        onClick={openSearch}
        className={cn(
          "hidden md:flex items-center gap-2 h-9 px-3 rounded-xl border border-border/60 bg-muted/50",
          "text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          "w-full max-w-xs"
        )}
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-medium opacity-60">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      {/* Mobile icon */}
      <button
        onClick={openSearch}
        className="md:hidden flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Search"
      >
        <Search className="size-4" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={closeSearch}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
            >
              <div className="bg-background rounded-2xl border border-border/60 shadow-[0_24px_64px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.3)] overflow-hidden">

                {/* Input row */}
                <div className="flex items-center gap-3 px-4 h-14 border-b border-border/60">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search tasks, notes, expenses…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                  />
                  {query ? (
                    <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="size-4" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border text-[10px] font-medium text-muted-foreground">
                      Esc
                    </kbd>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {!query.trim() ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      Start typing to search across all sections
                    </p>
                  ) : results.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      No results for <span className="text-foreground font-medium">"{query}"</span>
                    </p>
                  ) : (
                    <div className="py-2">
                      {grouped.map(({ type, items }) => {
                        const meta = TYPE_META[type]
                        const Icon = meta.icon
                        return (
                          <div key={type}>
                            {/* Section label */}
                            <div className="flex items-center gap-2 px-4 py-2">
                              <Icon className={cn("size-3 shrink-0", meta.color)} />
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                {meta.label}
                              </span>
                            </div>

                            {/* Items */}
                            {items.map((result) => (
                              <button
                                key={result.id}
                                onClick={() => handleSelect(result.href)}
                                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{result.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                                  {result.href}
                                </span>
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
