"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { budgets } from "@/lib/dummy-data"
import { cn, formatCurrency } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export function BudgetTracker() {
  const { activeGroup } = useGroup()
  const currency = activeGroup.currency

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-base font-semibold">Budget Tracker</CardTitle>
        <p className="text-xs text-muted-foreground">March 2026</p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col gap-4">
          {budgets.map((b, i) => {
            const pct = Math.min(Math.round((b.spent / b.budget) * 100), 100)
            const overBudget = b.spent > b.budget
            const remaining = b.budget - b.spent

            return (
              <motion.div
                key={b.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{b.icon}</span>
                    <span className="text-sm font-medium">{b.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatCurrency(b.spent, currency, 0)}</span>
                    <span className="text-xs text-muted-foreground"> / {formatCurrency(b.budget, currency, 0)}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: overBudget ? "var(--color-destructive)" : b.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                  />
                </div>
                <p className={cn(
                  "text-xs mt-1",
                  overBudget ? "text-destructive" : "text-muted-foreground"
                )}>
                  {overBudget
                    ? `${formatCurrency(Math.abs(remaining), currency)} over budget`
                    : b.spent === 0
                    ? "Not spent yet"
                    : `${formatCurrency(remaining, currency)} remaining`}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </CardContent>
    </Card>
  )
}
