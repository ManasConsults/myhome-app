"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { ShoppingItem } from "@/lib/types"
import { unstable_rethrow } from "next/navigation"
import { requireGroupOwner, requireEventMember } from "./_auth-guard"

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
    listId: s.listId ?? undefined,
    createdBy: s.createdBy ?? undefined,
    createdAt: toDateStr(s.createdAt),
    updatedAt: toDateStr(s.updatedAt),
  }
}

export async function getShoppingItems(groupId: string, eventId?: string): Promise<ShoppingItem[]> {
  await requireGroupOwner(groupId)
  if (eventId) {
    const event = await prisma.appEvent.findFirst({ where: { id: eventId, groupId }, select: { id: true } })
    if (!event) throw new Error("Forbidden")
  }
  const items = await prisma.shoppingItem.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { updatedAt: "desc" },
  })
  return items.map(serialize)
}

export async function getShoppingItemsByEvent(eventId: string): Promise<ShoppingItem[]> {
  await requireEventMember(eventId)
  const items = await prisma.shoppingItem.findMany({
    where: { eventId },
    orderBy: { updatedAt: "desc" },
  })
  return items.map(serialize)
}

export async function getShoppingItemsByList(listId: string): Promise<ShoppingItem[]> {
  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
    select: { groupId: true, eventId: true },
  })
  if (!list) throw new Error("Forbidden")
  if (list.eventId) {
    await requireEventMember(list.eventId)
  } else {
    await requireGroupOwner(list.groupId)
  }
  const items = await prisma.shoppingItem.findMany({
    where: { listId },
    orderBy: { updatedAt: "desc" },
  })
  return items.map(serialize)
}

export async function createShoppingItem(
  data: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: ShoppingItem } | { success: false; error: string }> {
  try {
    let resolvedGroupId = data.groupId
    let resolvedEventId: string | null = data.eventId ?? null
    let createdBy: string | null = null

    if (data.listId) {
      // Derive groupId and eventId from the parent list
      const list = await prisma.shoppingList.findUnique({
        where: { id: data.listId },
        select: { groupId: true, eventId: true },
      })
      if (!list) return { success: false, error: "List not found" }
      resolvedGroupId = list.groupId
      resolvedEventId = list.eventId
      if (list.eventId) {
        const { session } = await requireEventMember(list.eventId)
        createdBy = session.user.id
      } else {
        await requireGroupOwner(list.groupId)
      }
    } else if (data.eventId) {
      const { session, groupId } = await requireEventMember(data.eventId)
      resolvedGroupId = groupId
      createdBy = session.user.id
    } else {
      await requireGroupOwner(data.groupId)
    }

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
        groupId: resolvedGroupId,
        eventId: resolvedEventId,
        listId: data.listId ?? null,
        createdBy,
      },
    })
    return { success: true, data: serialize(s) }
  } catch (e) {
    unstable_rethrow(e)
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
      data: { ...data, eventId: data.eventId ?? null, listId: data.listId ?? null },
    })
    return { success: true, data: serialize(s) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteShoppingItem(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.shoppingItem.findUnique({
      where: { id },
      select: { groupId: true, eventId: true, createdBy: true },
    })
    if (!existing) return { success: false }

    if (existing.eventId) {
      const { session, isOwner } = await requireEventMember(existing.eventId)
      if (!isOwner && existing.createdBy !== session.user.id) throw new Error("Forbidden")
    } else {
      await requireGroupOwner(existing.groupId)
    }

    await prisma.shoppingItem.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}
