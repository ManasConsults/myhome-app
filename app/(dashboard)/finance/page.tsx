import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { MonthlyTrend } from "@/components/dashboard/MonthlyTrend"
import { SpendingBreakdown } from "@/components/dashboard/SpendingBreakdown"
import { FinanceSection } from "@/components/finance/FinanceSection"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react"
import { cn } from "@/lib/utils"
import { stats } from "@/lib/dummy-data"

export const metadata: Metadata = { title: "Finance" }

const summaryCards = [
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
    label: "Net Savings",
    value: stats.savings,
    icon: PiggyBank,
    trend: "+8.0%",
    positive: true,
    color: "text-warning",
    bg: "bg-warning/10",
  },
]

export default function FinancePage() {
  return (
    <>
      <Header title="Finance" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        {/* Summary cards */}
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
                  ${s.value.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                </p>
                <p className={cn("text-xs mt-1 font-medium", s.positive ? "text-success" : "text-destructive")}>
                  {s.trend} vs last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <MonthlyTrend />
          <SpendingBreakdown />
        </div>

        {/* Quick links — group-filtered */}
        <FinanceSection />
      </main>
    </>
  )
}
