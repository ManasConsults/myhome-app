"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQueries } from "@tanstack/react-query"
import { getExpenses, getIncomes } from "@/lib/actions/finance"
import type { Expense, Income } from "@/lib/types"

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function StatsCards() {
  const { activeGroup } = useGroup()
  const groupId = activeGroup.id
  const currency = activeGroup.currency

  const [{ data: expenses = [] }, { data: incomes = [] }] = useQueries({
    queries: [
      { queryKey: ["expenses", groupId, null], queryFn: () => getExpenses(groupId), staleTime: 60_000 },
      { queryKey: ["incomes",  groupId, null], queryFn: () => getIncomes(groupId),  staleTime: 60_000 },
    ],
  }) as [{ data: Expense[] }, { data: Income[] }]

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthIncome   = incomes.filter((i) => i.date.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0)
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0)
  const totalBalance  = incomes.reduce((s, i) => s + i.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0)
  const savings       = monthIncome - monthExpenses

  const cards = [
    { label: "Total Balance",    value: totalBalance,  icon: Wallet,      color: "text-primary",     bg: "bg-primary/10",     positive: true },
    { label: "Monthly Income",   value: monthIncome,   icon: TrendingUp,  color: "text-success",     bg: "bg-success/10",     positive: true },
    { label: "Monthly Expenses", value: monthExpenses, icon: TrendingDown,color: "text-destructive", bg: "bg-destructive/10", positive: false },
    { label: "Savings",          value: savings,       icon: PiggyBank,   color: "text-warning",     bg: "bg-warning/10",     positive: savings >= 0 },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={item}>
          <Card className="border-border/60 hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">{card.label}</p>
                <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", card.bg)}>
                  <card.icon className={cn("size-4", card.color)} />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold tracking-tight">
                {formatCurrency(Math.abs(card.value), currency)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
