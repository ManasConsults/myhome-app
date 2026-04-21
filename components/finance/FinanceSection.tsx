"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { PiggyBank, Receipt, Banknote, ArrowRight } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { userBudgets, expenses, incomes } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"

function monthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":      return amount * 52 / 12
    case "fortnightly": return amount * 26 / 12
    case "monthly":     return amount
    case "yearly":      return amount / 12
    default:            return 0
  }
}

export function FinanceSection() {
  const { activeGroup, activeEvent } = useGroup()
  const currency = activeGroup.currency

  const groupBudgets = activeEvent
    ? userBudgets.filter((b) => b.eventId === activeEvent.id)
    : userBudgets.filter((b) => b.groupId === activeGroup.id)
  const groupExpenses = activeEvent
    ? expenses.filter((e) => e.eventId === activeEvent.id)
    : expenses.filter((e) => e.groupId === activeGroup.id)
  const groupIncomes = activeEvent
    ? incomes.filter((i) => i.eventId === activeEvent.id)
    : incomes.filter((i) => i.groupId === activeGroup.id)

  const overBudget = groupBudgets.filter((b) => b.spent > b.amount).length
  const onTrack = groupBudgets.filter((b) => b.spent / b.amount < 0.8).length

  const recurringExpenses = groupExpenses.filter((e) => e.recurring)
  const monthlyExpenseFixed = recurringExpenses.reduce(
    (sum, e) => sum + monthlyEquivalent(e.amount, e.frequency ?? "monthly"), 0
  )

  const recurringIncome = groupIncomes.filter((i) => i.recurring)
  const monthlyIncomeRecurring = recurringIncome.reduce(
    (sum, i) => sum + monthlyEquivalent(i.amount, i.frequency ?? "monthly"), 0
  )

  const quickLinks = [
    {
      href: "/finance/budgets",
      label: "Budgets",
      icon: PiggyBank,
      color: "text-primary",
      bg: "bg-primary/10",
      stat: `${onTrack} on track · ${overBudget} over`,
    },
    {
      href: "/finance/expenses",
      label: "Expenses",
      icon: Receipt,
      color: "text-destructive",
      bg: "bg-destructive/10",
      stat: `${formatCurrency(monthlyExpenseFixed, currency, 0)}/mo fixed costs`,
    },
    {
      href: "/finance/income",
      label: "Income",
      icon: Banknote,
      color: "text-success",
      bg: "bg-success/10",
      stat: `${formatCurrency(monthlyIncomeRecurring, currency, 0)}/mo recurring`,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      {quickLinks.map((q) => (
        <Link key={q.href} href={q.href}>
          <Card className="border-border/60 cursor-pointer">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("size-9 rounded-lg flex items-center justify-center", q.bg)}>
                  <q.icon className={cn("size-5", q.color)} />
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm">{q.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{q.stat}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
