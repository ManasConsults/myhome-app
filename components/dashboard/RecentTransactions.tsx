"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { transactions } from "@/lib/dummy-data"

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
}

export function RecentTransactions() {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
          View all <ArrowUpRight data-icon="inline-end" />
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <motion.ul variants={container} initial="hidden" animate="visible" className="space-y-0">
          {transactions.slice(0, 6).map((tx) => (
            <motion.li
              key={tx.id}
              variants={item}
              className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
            >
              <div className="size-9 rounded-xl bg-muted flex items-center justify-center text-base shrink-0">
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.title}</p>
                <p className="text-xs text-muted-foreground">{tx.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-sm font-semibold",
                  tx.type === "income" ? "text-success" : "text-foreground"
                )}>
                  {tx.type === "income" ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </CardContent>
    </Card>
  )
}
