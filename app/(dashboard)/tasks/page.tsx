import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { TasksSection } from "@/components/tasks/TasksSection"
import { getCategories } from "@/lib/actions/categories"

export const metadata: Metadata = { title: "Tasks" }

export default async function TasksPage() {
  const categories = await getCategories("task")
  return (
    <>
      <Header title="Tasks" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-3xl w-full mx-auto">
        <TasksSection categories={categories} />
      </main>
    </>
  )
}
