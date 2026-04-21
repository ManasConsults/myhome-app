import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { TaskOverview } from "@/components/dashboard/TaskOverview"
import { SpendingBreakdown } from "@/components/dashboard/SpendingBreakdown"
import { MonthlyTrend } from "@/components/dashboard/MonthlyTrend"

export const metadata: Metadata = { title: "Dashboard" }

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl w-full mx-auto">
        {/* Stats row */}
        <StatsCards />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Transactions — takes 2 cols on large */}
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>
          {/* Tasks */}
          <div>
            <TaskOverview />
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <MonthlyTrend />
          <SpendingBreakdown />
        </div>
      </main>
    </>
  )
}
