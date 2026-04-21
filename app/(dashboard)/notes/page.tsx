import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { NotesSection } from "@/components/notes/NotesSection"

export const metadata: Metadata = { title: "Notes" }

export default function NotesPage() {
  return (
    <>
      <Header title="Notes" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-5xl w-full mx-auto">
        <NotesSection />
      </main>
    </>
  )
}
