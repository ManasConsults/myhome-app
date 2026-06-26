"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { ShoppingList } from "@/lib/types"
import { unstable_rethrow } from "next/navigation"
import { requireGroupOwner, requireEventMember } from "./_auth-guard"

type ListWithItems = Awaited<ReturnType<typeof prisma.shoppingList.findFirst>> & {
  items: { checked: boolean; estimatedPrice: number }[]
}

function serialize(l: ListWithItems): ShoppingList {
  if (!l) throw new Error("ShoppingList not found")
  return {
    id: l.id,
    name: l.name,
    groupId: l.groupId,
    eventId: l.eventId ?? undefined,
    createdBy: l.createdBy ?? undefined,
    itemCount: l.items.length,
    checkedCount: l.items.filter((i) => i.checked).length,
    estimatedTotal: l.items.reduce((sum, i) => sum + i.estimatedPrice, 0),
    createdAt: toDateStr(l.createdAt),
    updatedAt: toDateStr(l.updatedAt),
  }
}

const ITEMS_SELECT = { select: { checked: true, estimatedPrice: true } } as const

export async function getShoppingLists(groupId: string, eventId?: string): Promise<ShoppingList[]> {
  if (eventId) {
    await requireEventMember(eventId)
    const lists = await prisma.shoppingList.findMany({
      where: { eventId },
      include: { items: ITEMS_SELECT },
      orderBy: { createdAt: "asc" },
    })
    return lists.map(serialize)
  }
  await requireGroupOwner(groupId)
  const lists = await prisma.shoppingList.findMany({
    where: { groupId },
    include: { items: ITEMS_SELECT },
    orderBy: { createdAt: "asc" },
  })
  return lists.map(serialize)
}

export async function createShoppingList(data: {
  name: string
  groupId: string
  eventId?: string
}): Promise<{ success: true; data: ShoppingList } | { success: false; error: string }> {
  try {
    let resolvedGroupId = data.groupId
    let createdBy: string

    if (data.eventId) {
      const { session, groupId } = await requireEventMember(data.eventId)
      resolvedGroupId = groupId
      createdBy = session.user.id
    } else {
      const session = await requireGroupOwner(data.groupId)
      createdBy = session.user.id
    }

    const list = await prisma.shoppingList.create({
      data: {
        name: data.name.trim(),
        groupId: resolvedGroupId,
        eventId: data.eventId ?? null,
        createdBy,
      },
      include: { items: ITEMS_SELECT },
    })
    return { success: true, data: serialize(list) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateShoppingList(
  id: string,
  data: { name?: string; eventId?: string | null },
): Promise<{ success: true; data: ShoppingList } | { success: false; error: string }> {
  try {
    const existing = await prisma.shoppingList.findUnique({
      where: { id },
      select: { groupId: true, eventId: true, createdBy: true },
    })
    if (!existing) return { success: false, error: "Not found" }

    if (existing.eventId) {
      const { session, isOwner } = await requireEventMember(existing.eventId)
      if (!isOwner && existing.createdBy !== session.user.id) throw new Error("Forbidden")
    } else {
      await requireGroupOwner(existing.groupId)
    }

    const list = await prisma.shoppingList.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.eventId !== undefined ? { eventId: data.eventId } : {}),
      },
      include: { items: ITEMS_SELECT },
    })
    return { success: true, data: serialize(list) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteShoppingList(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.shoppingList.findUnique({
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

    await prisma.shoppingList.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}
