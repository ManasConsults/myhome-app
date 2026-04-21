import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { BudgetStats } from "@/components/finance/BudgetStats"
import { BudgetList } from "@/components/finance/BudgetList"
import { TransactionList } from "@/components/dashboard/TransactionList"

export const metadata: Metadata = { title: "Budgets" }

export default function BudgetsPage() {
  return (
    <>
      <Header title="Budgets" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        <BudgetStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          <div className="lg:col-span-2">
            <BudgetList />
          </div>
          <TransactionList />
        </div>
      </main>
    </>
  )
}
