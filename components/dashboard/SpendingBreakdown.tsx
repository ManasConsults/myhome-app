"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQuery } from "@tanstack/react-query"
import { getExpenses } from "@/lib/actions/finance"
import type { Expense } from "@/lib/types"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export function SpendingBreakdown() {
  const { activeGroup } = useGroup()
  const groupId = activeGroup.id

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["expenses", groupId, null],
    queryFn: () => getExpenses(groupId),
    staleTime: 60_000,
  })

  const now = new Date()
  const periodLabel = now.toLocaleString("default", { month: "long", year: "numeric" })

  const categoryMap = new Map<string, number>()
  for (const e of expenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount)
  }
  const spendingByCategory = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount], i) => ({ category, amount, color: CHART_COLORS[i % CHART_COLORS.length] }))

  const total = spendingByCategory.reduce((sum, c) => sum + c.amount, 0)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-base font-semibold">Spending Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">{periodLabel}</p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {spendingByCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No expenses yet</p>
        ) : (
          <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col gap-3">
            {spendingByCategory.map((cat, i) => {
              const pct = Math.round((cat.amount / total) * 100)
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">${cat.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{pct}% of total</p>
                </div>
              )
            })}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
