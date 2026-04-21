import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { MealsSection } from "@/components/meals/MealsSection"

export const metadata: Metadata = { title: "Meal Planning" }

export default function MealsPage() {
  return (
    <>
      <Header title="Meal Planning" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        <MealsSection />
      </main>
    </>
  )
}
