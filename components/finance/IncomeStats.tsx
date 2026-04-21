"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, RefreshCw, Banknote, CalendarDays } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { incomes } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function fmtDate(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`
}

function monthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":      return amount * 52 / 12
    case "fortnightly": return amount * 26 / 12
    case "monthly":     return amount
    case "yearly":      return amount / 12
    default:            return 0
  }
}

const currentMonth = "2026-04"

export function IncomeStats() {
  const { activeGroup, activeEvent } = useGroup()
  const currency = activeGroup.currency
  const groupIncomes = activeEvent
    ? incomes.filter((i) => i.eventId === activeEvent.id)
    : incomes.filter((i) => i.groupId === activeGroup.id)
  const recurring = groupIncomes.filter((i) => i.recurring)
  const oneOff = groupIncomes.filter((i) => !i.recurring && i.date.startsWith(currentMonth))

  const recurringMonthly = recurring.reduce(
    (sum, i) => sum + monthlyEquivalent(i.amount, i.frequency ?? "monthly"),
    0
  )
  const oneOffTotal = oneOff.reduce((sum, i) => sum + i.amount, 0)
  const totalMonthly = recurringMonthly + oneOffTotal

  const stats = [
    {
      label: "Total this month",
      value: formatCurrency(totalMonthly, currency, 0),
      sub: "recurring + one-off",
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Monthly recurring",
      value: formatCurrency(recurringMonthly, currency, 0),
      sub: `${recurring.length} sources`,
      icon: RefreshCw,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "One-off this month",
      value: formatCurrency(oneOffTotal, currency),
      sub: `${oneOff.length} payments`,
      icon: Banknote,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Next expected",
      value: (() => {
        const upcoming = recurring
          .filter((i) => i.nextDate)
          .sort((a, b) => (a.nextDate! > b.nextDate! ? 1 : -1))[0]
        if (!upcoming?.nextDate) return "—"
        return fmtDate(upcoming.nextDate)
      })(),
      sub: (() => {
        const upcoming = recurring
          .filter((i) => i.nextDate)
          .sort((a, b) => (a.nextDate! > b.nextDate! ? 1 : -1))[0]
        return upcoming?.title ?? ""
      })(),
      icon: CalendarDays,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium leading-snug">{s.label}</p>
              <div className={cn("size-7 rounded-md flex items-center justify-center shrink-0", s.bg)}>
                <s.icon className={cn("size-3.5", s.color)} />
              </div>
            </div>
            <p className="text-lg font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
