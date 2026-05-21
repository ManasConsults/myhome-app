"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { AppEvent } from "@/lib/types"

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

export async function getEventsByUser(userId: string): Promise<AppEvent[]> {
  const groups = await prisma.group.findMany({ where: { userId }, select: { id: true } })
  const groupIds = groups.map((g) => g.id)
  const events = await prisma.appEvent.findMany({
    where: { groupId: { in: groupIds } },
    orderBy: { startDate: "asc" },
  })
  return events.map(serialize)
}

export async function getEvents(groupId: string): Promise<AppEvent[]> {
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
    return { success: false, error: String(e) }
  }
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<AppEvent, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: AppEvent } | { success: false; error: string }> {
  try {
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
    return { success: false, error: String(e) }
  }
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.appEvent.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
