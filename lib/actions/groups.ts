"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { Group } from "@/lib/dummy-data"

function serialize(g: Awaited<ReturnType<typeof prisma.group.findFirst>>): Group {
  if (!g) throw new Error("Group not found")
  return {
    id: g.id,
    name: g.name,
    type: "household",
    icon: g.icon,
    color: g.color as Group["color"],
    currency: g.currency,
    description: g.description ?? undefined,
    location: g.location ?? undefined,
    isDefault: g.isDefault,
    userId: g.userId,
    createdAt: toDateStr(g.createdAt),
    updatedAt: toDateStr(g.updatedAt),
  }
}

export async function getGroups(userId: string): Promise<Group[]> {
  const groups = await prisma.group.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })
  return groups.map((g) => serialize(g))
}

export async function createGroup(
  userId: string,
  data: Omit<Group, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Group } | { success: false; error: string }> {
  try {
    const g = await prisma.group.create({
      data: { ...data, userId, type: "household" },
    })
    return { success: true, data: serialize(g) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateGroup(
  id: string,
  data: Partial<Omit<Group, "id" | "userId" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Group } | { success: false; error: string }> {
  try {
    const g = await prisma.group.update({ where: { id }, data })
    return { success: true, data: serialize(g) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteGroup(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const g = await prisma.group.findUnique({ where: { id } })
    if (g?.isDefault) return { success: false, error: "Cannot delete the default group." }
    await prisma.group.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

type GroupDataCounts = {
  tasks: number
  shoppingItems: number
  notes: number
  calendarEvents: number
  expenses: number
  incomes: number
  budgets: number
  loans: number
  mealPlanDays: number
}

export async function getGroupDataCounts(groupId: string): Promise<GroupDataCounts> {
  const [tasks, shoppingItems, notes, calendarEvents, expenses, incomes, budgets, loans, mealPlanDays] =
    await prisma.$transaction([
      prisma.task.count({ where: { groupId } }),
      prisma.shoppingItem.count({ where: { groupId } }),
      prisma.note.count({ where: { groupId } }),
      prisma.calendarEvent.count({ where: { groupId } }),
      prisma.expense.count({ where: { groupId } }),
      prisma.income.count({ where: { groupId } }),
      prisma.budget.count({ where: { groupId } }),
      prisma.loan.count({ where: { groupId } }),
      prisma.dayMeals.count({ where: { groupId } }),
    ])
  return { tasks, shoppingItems, notes, calendarEvents, expenses, incomes, budgets, loans, mealPlanDays }
}
