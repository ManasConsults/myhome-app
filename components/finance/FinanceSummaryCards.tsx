"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQueries } from "@tanstack/react-query"
import { getExpenses, getIncomes } from "@/lib/actions/finance"

function monthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":      return amount * 52 / 12
    case "fortnightly": return amount * 26 / 12
    case "monthly":     return amount
    case "yearly":      return amount / 12
    default:            return 0
  }
}

export function FinanceSummaryCards() {
  const { activeGroup, activeEvent } = useGroup()
  const currency = activeGroup.currency

  const [expensesQ, incomesQ] = useQueries({
    queries: [
      {
        queryKey: ["expenses", activeGroup.id, activeEvent?.id ?? null],
        queryFn: () => getExpenses(activeGroup.id, activeEvent?.id),
      },
      {
        queryKey: ["incomes", activeGroup.id, activeEvent?.id ?? null],
        queryFn: () => getIncomes(activeGroup.id, activeEvent?.id),
      },
    ],
  })

  const expenses = expensesQ.data ?? []
  const incomes = incomesQ.data ?? []

  const monthlyIncome = incomes
    .filter((i) => i.recurring)
    .reduce((sum, i) => sum + monthlyEquivalent(i.amount, i.frequency ?? "monthly"), 0)

  const monthlyExpenses = expenses
    .filter((e) => e.recurring)
    .reduce((sum, e) => sum + monthlyEquivalent(e.amount, e.frequency ?? "monthly"), 0)

  const netSavings = monthlyIncome - monthlyExpenses

  const summaryCards = [
    {
      label: "Monthly Income",
      value: monthlyIncome,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Monthly Expenses",
      value: monthlyExpenses,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Net Savings",
      value: netSavings,
      icon: PiggyBank,
      color: netSavings >= 0 ? "text-warning" : "text-destructive",
      bg: netSavings >= 0 ? "bg-warning/10" : "bg-destructive/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      {summaryCards.map((s) => (
        <Card key={s.label} className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs md:text-sm text-muted-foreground font-medium">{s.label}</p>
              <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                <s.icon className={cn("size-4", s.color)} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold tracking-tight">
              {formatCurrency(s.value, currency)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
