import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { CalendarSection } from "@/components/calendar/CalendarSection"
import { getCategories } from "@/lib/actions/categories"

export const metadata: Metadata = { title: "Calendar" }

export default async function CalendarPage() {
  const categories = await getCategories("calendar")
  return (
    <>
      <Header title="Calendar" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-5xl w-full mx-auto">
        <CalendarSection categories={categories} />
      </main>
    </>
  )
}
