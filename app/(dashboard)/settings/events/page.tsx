import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { EventsManager } from "@/components/settings/EventsManager"

export const metadata: Metadata = { title: "Events" }

export default function EventsPage() {
  return (
    <>
      <Header title="Events" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-2xl w-full mx-auto">
        <EventsManager />
      </main>
    </>
  )
}
