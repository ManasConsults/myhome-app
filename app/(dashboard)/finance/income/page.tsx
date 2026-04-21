import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { IncomeStats } from "@/components/finance/IncomeStats"
import { IncomeList } from "@/components/finance/IncomeList"

export const metadata: Metadata = { title: "Income" }

export default function IncomePage() {
  return (
    <>
      <Header title="Income" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        <IncomeStats />
        <IncomeList />
      </main>
    </>
  )
}
