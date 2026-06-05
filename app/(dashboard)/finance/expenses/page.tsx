import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { ExpenseStats } from "@/components/finance/ExpenseStats"
import { ExpenseList } from "@/components/finance/ExpenseList"
import { getCategories } from "@/lib/actions/categories"

export const metadata: Metadata = { title: "Expenses" }

export default async function ExpensesPage() {
  const expenseCategories = await getCategories("expense")
  return (
    <>
      <Header title="Expenses" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        <ExpenseStats />
        <ExpenseList expenseCategories={expenseCategories} />
      </main>
    </>
  )
}
