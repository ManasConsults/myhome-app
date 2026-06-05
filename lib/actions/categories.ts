"use server"

import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"
import type { Category, CategoryDomain } from "@/lib/types"
import { toDateStr } from "@/lib/utils"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "admin") throw new Error("Forbidden")
}

function serialize(
  c: Awaited<ReturnType<typeof prisma.category.findFirst>>
): Category {
  if (!c) throw new Error("Category not found")
  return {
    id: c.id,
    domain: c.domain as CategoryDomain,
    name: c.name,
    icon: c.icon,
    color: c.color,
    sortOrder: c.sortOrder,
    createdAt: toDateStr(c.createdAt),
    updatedAt: toDateStr(c.updatedAt),
  }
}

// ── Counts how many existing records reference a category name ───────────────

async function usageCount(domain: CategoryDomain, name: string): Promise<number> {
  switch (domain) {
    case "expense":
      return (
        (await prisma.expense.count({ where: { category: name } })) +
        (await prisma.budget.count({ where: { category: name } }))
      )
    case "income":
      return prisma.income.count({ where: { category: name } })
    case "task":
      return prisma.task.count({ where: { category: name } })
    case "shopping":
      return prisma.shoppingItem.count({ where: { category: name } })
    case "note":
      return prisma.note.count({ where: { category: name } })
    case "calendar":
      return prisma.calendarEvent.count({ where: { category: name } })
    case "meal_tag":
      return prisma.recipe.count({ where: { tags: { has: name } } })
  }
}

// ── Public read ──────────────────────────────────────────────────────────────

export async function getCategories(domain: CategoryDomain): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { domain },
    orderBy: { sortOrder: "asc" },
  })
  return rows.map(serialize)
}

export async function getAllCategories(): Promise<Record<CategoryDomain, Category[]>> {
  const domains: CategoryDomain[] = ["expense", "income", "task", "shopping", "note", "calendar", "meal_tag"]
  const results = await Promise.all(domains.map((d) => getCategories(d)))
  return Object.fromEntries(domains.map((d, i) => [d, results[i]])) as Record<CategoryDomain, Category[]>
}

// ── Admin mutations ──────────────────────────────────────────────────────────

export async function createCategory(
  domain: CategoryDomain,
  data: { name: string; icon: string; color: string }
): Promise<{ success: boolean; data?: Category; error?: string }> {
  try {
    await requireAdmin()
    const maxOrder = await prisma.category.aggregate({
      where: { domain },
      _max: { sortOrder: true },
    })
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1
    const row = await prisma.category.create({
      data: { domain, name: data.name.trim(), icon: data.icon, color: data.color, sortOrder: nextOrder },
    })
    return { success: true, data: serialize(row) }
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateCategory(
  id: string,
  data: { name: string; icon: string; color: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.category.update({
      where: { id },
      data: { name: data.name.trim(), icon: data.icon, color: data.color },
    })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteCategory(
  id: string
): Promise<{ success: boolean; usageCount?: number; error?: string }> {
  try {
    await requireAdmin()
    const cat = await prisma.category.findUnique({ where: { id } })
    if (!cat) return { success: false, error: "Not found" }

    const count = await usageCount(cat.domain as CategoryDomain, cat.name)
    if (count > 0) return { success: false, usageCount: count }

    await prisma.category.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function reorderCategory(
  id: string,
  direction: "up" | "down"
): Promise<{ success: boolean }> {
  try {
    await requireAdmin()
    const cat = await prisma.category.findUnique({ where: { id } })
    if (!cat) return { success: false }

    const neighbour = await prisma.category.findFirst({
      where: {
        domain: cat.domain,
        sortOrder: direction === "up" ? { lt: cat.sortOrder } : { gt: cat.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    })
    if (!neighbour) return { success: false }

    await prisma.$transaction([
      prisma.category.update({ where: { id: cat.id }, data: { sortOrder: neighbour.sortOrder } }),
      prisma.category.update({ where: { id: neighbour.id }, data: { sortOrder: cat.sortOrder } }),
    ])
    return { success: true }
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") throw e
    return { success: false }
  }
}
