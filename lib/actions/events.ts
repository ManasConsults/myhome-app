"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { AppEvent, SharedEvent } from "@/lib/types"
import { unstable_rethrow } from "next/navigation"
import { requireSession, requireGroupOwner } from "./_auth-guard"

function serialize(e: Awaited<ReturnType<typeof prisma.appEvent.findFirst>>): AppEvent {
  if (!e) throw new Error("Event not found")
  return {
    id: e.id,
    groupId: e.groupId,
    name: e.name,
    description: e.description ?? undefined,
    icon: e.icon,
    color: e.color as AppEvent["color"],
    startDate: toDateStr(e.startDate),
    endDate: e.endDate ? toDateStr(e.endDate) : undefined,
    createdAt: toDateStr(e.createdAt),
    updatedAt: toDateStr(e.updatedAt),
  }
}

export async function getEventsByUser(): Promise<AppEvent[]> {
  const session = await requireSession()
  const groups = await prisma.group.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const groupIds = groups.map((g) => g.id)
  const events = await prisma.appEvent.findMany({
    where: { groupId: { in: groupIds } },
    orderBy: { startDate: "asc" },
  })
  return events.map(serialize)
}

export async function getEvents(groupId: string): Promise<AppEvent[]> {
  await requireGroupOwner(groupId)
  const events = await prisma.appEvent.findMany({
    where: { groupId },
    orderBy: { startDate: "asc" },
  })
  return events.map(serialize)
}

export async function createEvent(
  data: Omit<AppEvent, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: AppEvent } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    const e = await prisma.appEvent.create({
      data: {
        groupId: data.groupId,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })
    return { success: true, data: serialize(e) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<AppEvent, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: AppEvent } | { success: false; error: string }> {
  try {
    const existing = await prisma.appEvent.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const e = await prisma.appEvent.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
      },
    })
    return { success: true, data: serialize(e) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function getSharedEventsByUser(): Promise<SharedEvent[]> {
  const session = await requireSession()
  const memberships = await prisma.eventMember.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: { group: { select: { name: true, currency: true, icon: true, user: { select: { name: true } } } } },
      },
    },
    orderBy: { event: { startDate: "asc" } },
  })
  return memberships.map(({ event: e }) => ({
    id: e.id,
    groupId: e.groupId,
    name: e.name,
    description: e.description ?? undefined,
    icon: e.icon,
    color: e.color as AppEvent["color"],
    startDate: toDateStr(e.startDate),
    endDate: e.endDate ? toDateStr(e.endDate) : undefined,
    createdAt: toDateStr(e.createdAt),
    updatedAt: toDateStr(e.updatedAt),
    sharedByName: e.group.user.name,
    groupName: e.group.name,
    groupCurrency: e.group.currency,
    groupIcon: e.group.icon,
  }))
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.appEvent.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    await prisma.appEvent.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}
