"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { Recipe, DayMeals } from "@/lib/types"
import { requireSession, requireGroupOwner } from "./_auth-guard"

// ─── Recipe ──────────────────────────────────────────────────────────────────

function serializeRecipe(r: Awaited<ReturnType<typeof prisma.recipe.findFirst>>): Recipe {
  if (!r) throw new Error("Recipe not found")
  return {
    id: r.id,
    name: r.name,
    mealType: r.mealType as Recipe["mealType"],
    prepTime: r.prepTime,
    calories: r.calories,
    servings: r.servings,
    tags: r.tags,
    icon: r.icon,
    createdAt: toDateStr(r.createdAt),
    updatedAt: toDateStr(r.updatedAt),
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  await requireSession()
  const items = await prisma.recipe.findMany({ orderBy: { name: "asc" } })
  return items.map(serializeRecipe)
}

export async function createRecipe(
  data: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Recipe } | { success: false; error: string }> {
  try {
    await requireSession()
    const r = await prisma.recipe.create({
      data: {
        name: data.name,
        mealType: data.mealType,
        prepTime: data.prepTime,
        calories: data.calories,
        servings: data.servings,
        tags: data.tags,
        icon: data.icon,
      },
    })
    return { success: true, data: serializeRecipe(r) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateRecipe(
  id: string,
  data: Partial<Omit<Recipe, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Recipe } | { success: false; error: string }> {
  try {
    await requireSession()
    const r = await prisma.recipe.update({ where: { id }, data })
    return { success: true, data: serializeRecipe(r) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteRecipe(id: string): Promise<{ success: boolean }> {
  try {
    await requireSession()
    await prisma.recipe.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}

// ─── DayMeals ────────────────────────────────────────────────────────────────

function serializeDayMeals(d: Awaited<ReturnType<typeof prisma.dayMeals.findFirst>>): DayMeals {
  if (!d) throw new Error("DayMeals not found")
  return {
    day: d.day,
    breakfast: d.breakfast,
    lunch: d.lunch,
    dinner: d.dinner,
    groupId: d.groupId,
    eventId: d.eventId ?? undefined,
    createdAt: toDateStr(d.createdAt),
    updatedAt: toDateStr(d.updatedAt),
  }
}

export async function getMealPlan(groupId: string, eventId?: string): Promise<DayMeals[]> {
  await requireGroupOwner(groupId)
  const items = await prisma.dayMeals.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { day: "asc" },
  })
  return items.map(serializeDayMeals)
}

export async function upsertDayMeals(
  data: Omit<DayMeals, "createdAt" | "updatedAt">,
): Promise<{ success: true; data: DayMeals } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    // Postgres treats NULL != NULL in unique constraints, so upsert doesn't work
    // when eventId is null — must use findFirst + conditional create/update instead
    const existing = await prisma.dayMeals.findFirst({
      where: data.eventId
        ? { groupId: data.groupId, eventId: data.eventId, day: data.day }
        : { groupId: data.groupId, eventId: null, day: data.day },
    })

    const payload = {
      breakfast: data.breakfast,
      lunch: data.lunch,
      dinner: data.dinner,
    }

    const result = existing
      ? await prisma.dayMeals.update({ where: { id: existing.id }, data: payload })
      : await prisma.dayMeals.create({
          data: {
            ...payload,
            day: data.day,
            groupId: data.groupId,
            eventId: data.eventId ?? null,
          },
        })

    return { success: true, data: serializeDayMeals(result) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteDayMeals(groupId: string, day: string, eventId?: string): Promise<{ success: boolean }> {
  try {
    await requireGroupOwner(groupId)
    const existing = await prisma.dayMeals.findFirst({
      where: eventId
        ? { groupId, eventId, day }
        : { groupId, eventId: null, day },
    })
    if (existing) {
      await prisma.dayMeals.delete({ where: { id: existing.id } })
    }
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}
