import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { GroupsManager } from "@/components/settings/GroupsManager"

export const metadata: Metadata = { title: "Groups" }

export default function GroupsPage() {
  return (
    <>
      <Header title="Groups" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-2xl w-full mx-auto">
        <GroupsManager />
      </main>
    </>
  )
}
