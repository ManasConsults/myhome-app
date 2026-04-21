"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { transactions } from "@/lib/dummy-data"

type Filter = "all" | "income" | "expense"

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
]

export function TransactionList() {
  const [filter, setFilter] = useState<Filter>("all")

  const filtered = transactions.filter((tx) =>
    filter === "all" ? true : tx.type === filter
  )

  const total = filtered.reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">All Transactions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">March 2026</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all duration-150",
                  filter === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {/* Summary line */}
        <div className={cn(
          "text-sm font-semibold mb-4 px-1",
          total >= 0 ? "text-success" : "text-foreground"
        )}>
          {filter === "all" ? "Net" : filter === "income" ? "Total income" : "Total expenses"}:{" "}
          {total >= 0 ? "+" : ""}${Math.abs(total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>

        <AnimatePresence mode="wait">
          <motion.ul
            key={filter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">No transactions</li>
            ) : (
              filtered.map((tx, i) => (
                <motion.li
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                  className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0"
                >
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-base shrink-0">
                    {tx.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-xs h-4 px-1.5 border-0 bg-muted text-muted-foreground font-normal"
                      >
                        {tx.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold shrink-0",
                    tx.type === "income" ? "text-success" : "text-foreground"
                  )}>
                    {tx.type === "income" ? "+" : "−"}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                </motion.li>
              ))
            )}
          </motion.ul>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
