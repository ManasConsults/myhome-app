"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { PiggyBank, Receipt, Banknote, ArrowRight } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQueries } from "@tanstack/react-query"
import { getBudgets, getExpenses, getIncomes } from "@/lib/actions/finance"

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
  const scopeArgs: [string, string | undefined] = [activeGroup.id, activeEvent?.id]

  const [budgetsQ, expensesQ, incomesQ] = useQueries({
    queries: [
      {
        queryKey: ["budgets", activeGroup.id, activeEvent?.id ?? null],
        queryFn: () => getBudgets(...scopeArgs),
      },
      {
        queryKey: ["expenses", activeGroup.id, activeEvent?.id ?? null],
        queryFn: () => getExpenses(...scopeArgs),
      },
      {
        queryKey: ["incomes", activeGroup.id, activeEvent?.id ?? null],
        queryFn: () => getIncomes(...scopeArgs),
      },
    ],
  })

  const groupBudgets = budgetsQ.data ?? []
  const groupExpenses = expensesQ.data ?? []
  const groupIncomes = incomesQ.data ?? []

  const overBudget = groupBudgets.filter((b) => b.spent > b.amount).length
  const onTrack = groupBudgets.filter((b) => b.spent / b.amount < 0.8).length

  const monthlyExpenseFixed = groupExpenses
    .filter((e) => e.recurring)
    .reduce((sum, e) => sum + monthlyEquivalent(e.amount, e.frequency ?? "monthly"), 0)

  const monthlyIncomeRecurring = groupIncomes
    .filter((i) => i.recurring)
    .reduce((sum, i) => sum + monthlyEquivalent(i.amount, i.frequency ?? "monthly"), 0)

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
