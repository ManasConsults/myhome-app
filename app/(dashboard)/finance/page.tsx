import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { MonthlyTrend } from "@/components/dashboard/MonthlyTrend"
import { SpendingBreakdown } from "@/components/dashboard/SpendingBreakdown"
import { FinanceSection } from "@/components/finance/FinanceSection"
import { FinanceSummaryCards } from "@/components/finance/FinanceSummaryCards"

export const metadata: Metadata = { title: "Finance" }

export default function FinancePage() {
  return (
    <>
      <Header title="Finance" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        <FinanceSummaryCards />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <MonthlyTrend />
          <SpendingBreakdown />
        </div>

        <FinanceSection />
      </main>
    </>
  )
}
