"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { ShoppingItem } from "@/lib/types"
import { requireGroupOwner } from "./_auth-guard"

function serialize(s: Awaited<ReturnType<typeof prisma.shoppingItem.findFirst>>): ShoppingItem {
  if (!s) throw new Error("ShoppingItem not found")
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    quantity: s.quantity,
    unit: s.unit,
    estimatedPrice: s.estimatedPrice,
    checked: s.checked,
    store: s.store,
    icon: s.icon,
    groupId: s.groupId,
    eventId: s.eventId ?? undefined,
    createdAt: toDateStr(s.createdAt),
    updatedAt: toDateStr(s.updatedAt),
  }
}

export async function getShoppingItems(groupId: string, eventId?: string): Promise<ShoppingItem[]> {
  await requireGroupOwner(groupId)
  const items = await prisma.shoppingItem.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { updatedAt: "desc" },
  })
  return items.map(serialize)
}

export async function createShoppingItem(
  data: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: ShoppingItem } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    const s = await prisma.shoppingItem.create({
      data: {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        estimatedPrice: data.estimatedPrice,
        checked: data.checked,
        store: data.store,
        icon: data.icon,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serialize(s) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateShoppingItem(
  id: string,
  data: Partial<Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: ShoppingItem } | { success: false; error: string }> {
  try {
    const existing = await prisma.shoppingItem.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const s = await prisma.shoppingItem.update({
      where: { id },
      data: { ...data, eventId: data.eventId ?? null },
    })
    return { success: true, data: serialize(s) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteShoppingItem(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.shoppingItem.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false }
    await requireGroupOwner(existing.groupId)
    await prisma.shoppingItem.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}
