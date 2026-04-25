"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQueries } from "@tanstack/react-query"
import { getExpenses, getIncomes } from "@/lib/actions/finance"
import type { Expense, Income } from "@/lib/dummy-data"

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function last6Months(): { key: string; label: string }[] {
  const result = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({ key: d.toISOString().slice(0, 7), label: MONTH_ABBR[d.getMonth()] })
  }
  return result
}

export function MonthlyTrend() {
  const { activeGroup } = useGroup()
  const groupId = activeGroup.id

  const [{ data: expenses = [] }, { data: incomes = [] }] = useQueries({
    queries: [
      { queryKey: ["expenses", groupId, null], queryFn: () => getExpenses(groupId), staleTime: 60_000 },
      { queryKey: ["incomes",  groupId, null], queryFn: () => getIncomes(groupId),  staleTime: 60_000 },
    ],
  }) as [{ data: Expense[] }, { data: Income[] }]

  const months = last6Months()
  const monthlyTrend = months.map(({ key, label }) => ({
    month: label,
    income:   incomes.filter((i) => i.date.startsWith(key)).reduce((s, i) => s + i.amount, 0),
    expenses: expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0),
  }))

  const maxVal = Math.max(...monthlyTrend.flatMap((m) => [m.income, m.expenses]), 1)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary inline-block" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-destructive/70 inline-block" /> Expenses
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex items-end justify-between gap-2 h-32">
          {monthlyTrend.map((month, i) => (
            <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 h-24">
                <motion.div
                  className="flex-1 rounded-t-sm bg-primary/80"
                  initial={{ height: 0 }}
                  animate={{ height: `${(month.income / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: "easeOut" }}
                />
                <motion.div
                  className="flex-1 rounded-t-sm bg-destructive/60"
                  initial={{ height: 0 }}
                  animate={{ height: `${(month.expenses / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.07 + 0.05, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{month.month}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
