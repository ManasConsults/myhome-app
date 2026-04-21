import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { LoansSection } from "@/components/finance/LoansSection"

export const metadata: Metadata = { title: "Loans" }

export default function LoansPage() {
  return (
    <>
      <Header title="Loans" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        <LoansSection />
      </main>
    </>
  )
}
