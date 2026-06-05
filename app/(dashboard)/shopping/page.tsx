import type { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { ShoppingSection } from "@/components/shopping/ShoppingSection"
import { getCategories } from "@/lib/actions/categories"

export const metadata: Metadata = { title: "Shopping" }

export default async function ShoppingPage() {
  const categories = await getCategories("shopping")
  return (
    <>
      <Header title="Shopping" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-2xl w-full mx-auto">
        <ShoppingSection categories={categories} />
      </main>
    </>
  )
}
