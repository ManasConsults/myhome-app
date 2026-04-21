"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { monthlyTrend } from "@/lib/dummy-data"

export function MonthlyTrend() {
  const maxVal = Math.max(...monthlyTrend.flatMap((m) => [m.income, m.expenses]))

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
                {/* Income bar */}
                <motion.div
                  className="flex-1 rounded-t-sm bg-primary/80"
                  initial={{ height: 0 }}
                  animate={{ height: `${(month.income / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: "easeOut" }}
                />
                {/* Expenses bar */}
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
