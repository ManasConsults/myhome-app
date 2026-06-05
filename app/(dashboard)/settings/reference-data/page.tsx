import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { ReferenceDataManager } from "@/components/settings/ReferenceDataManager"
import { getAllCategories } from "@/lib/actions/categories"

export const metadata: Metadata = { title: "Reference Data" }

export default async function ReferenceDataPage() {
  const initialData = await getAllCategories()
  return (
    <>
      <Header title="Reference Data" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-3xl w-full mx-auto">
        <ReferenceDataManager initialData={initialData} />
      </main>
    </>
  )
}
