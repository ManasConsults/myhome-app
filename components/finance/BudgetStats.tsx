"use client"

import { Target, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import { userBudgets } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"

export function BudgetStats() {
  const { activeGroup, activeEvent } = useGroup()
  const currency = activeGroup.currency
  const groupBudgets = activeEvent
    ? userBudgets.filter((b) => b.eventId === activeEvent.id)
    : userBudgets.filter((b) => b.groupId === activeGroup.id)

  const totalBudgeted = groupBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = groupBudgets.reduce((sum, b) => sum + b.spent, 0)
  const onTrackCount = groupBudgets.filter((b) => b.spent / b.amount < 0.8).length
  const overBudgetCount = groupBudgets.filter((b) => b.spent / b.amount >= 1.0).length

  const budgetStats = [
    {
      label: "Total Budgeted",
      value: formatCurrency(totalBudgeted, currency, 0),
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent, currency),
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "On Track",
      value: `${onTrackCount} budget${onTrackCount !== 1 ? "s" : ""}`,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Over Budget",
      value: `${overBudgetCount} budget${overBudgetCount !== 1 ? "s" : ""}`,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {budgetStats.map((s) => (
        <Card key={s.label} className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs md:text-sm text-muted-foreground font-medium">{s.label}</p>
              <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                <s.icon className={cn("size-4", s.color)} />
              </div>
            </div>
            <p className={cn("text-xl md:text-2xl font-bold tracking-tight", s.color)}>
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
