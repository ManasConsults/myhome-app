"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { stats } from "@/lib/dummy-data"

const cards = [
  {
    label: "Total Balance",
    value: stats.balance,
    icon: Wallet,
    trend: "+4.2%",
    positive: true,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Monthly Income",
    value: stats.income,
    icon: TrendingUp,
    trend: "+15.5%",
    positive: true,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Monthly Expenses",
    value: stats.expenses,
    icon: TrendingDown,
    trend: "+3.1%",
    positive: false,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    label: "Savings",
    value: stats.savings,
    icon: PiggyBank,
    trend: "+8.0%",
    positive: true,
    color: "text-warning",
    bg: "bg-warning/10",
  },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function StatsCards() {
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
                ${Math.abs(card.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className={cn("text-xs mt-1 font-medium", card.positive ? "text-success" : "text-destructive")}>
                {card.trend} vs last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
