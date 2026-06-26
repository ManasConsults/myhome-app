"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"
import { unstable_rethrow } from "next/navigation"
import { requireGroupOwner, requireEventMember } from "./_auth-guard"

function serialize(c: Awaited<ReturnType<typeof prisma.calendarEvent.findFirst>>): CalendarEvent {
  if (!c) throw new Error("CalendarEvent not found")
  return {
    id: c.id,
    title: c.title,
    date: toDateStr(c.date),
    time: c.time ?? undefined,
    category: c.category as CalendarEvent["category"],
    allDay: c.allDay,
    icon: c.icon,
    groupId: c.groupId,
    eventId: c.eventId ?? undefined,
    createdBy: c.createdBy ?? undefined,
    createdAt: toDateStr(c.createdAt),
    updatedAt: toDateStr(c.updatedAt),
  }
}

export async function getCalendarEvents(groupId: string, eventId?: string): Promise<CalendarEvent[]> {
  await requireGroupOwner(groupId)
  if (eventId) {
    const event = await prisma.appEvent.findFirst({ where: { id: eventId, groupId }, select: { id: true } })
    if (!event) throw new Error("Forbidden")
  }
  const events = await prisma.calendarEvent.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { date: "asc" },
  })
  return events.map(serialize)
}

export async function getCalendarEventsByEvent(eventId: string): Promise<CalendarEvent[]> {
  await requireEventMember(eventId)
  const events = await prisma.calendarEvent.findMany({
    where: { eventId },
    orderBy: { date: "asc" },
  })
  return events.map(serialize)
}

export async function createCalendarEvent(
  data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: CalendarEvent } | { success: false; error: string }> {
  try {
    let resolvedGroupId = data.groupId
    let createdBy: string | null = null

    if (data.eventId) {
      const { session, groupId } = await requireEventMember(data.eventId)
      resolvedGroupId = groupId
      createdBy = session.user.id
    } else {
      await requireGroupOwner(data.groupId)
    }

    const c = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        time: data.time ?? null,
        category: data.category,
        allDay: data.allDay,
        icon: data.icon,
        groupId: resolvedGroupId,
        eventId: data.eventId ?? null,
        createdBy,
      },
    })
    return { success: true, data: serialize(c) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateCalendarEvent(
  id: string,
  data: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: CalendarEvent } | { success: false; error: string }> {
  try {
    const existing = await prisma.calendarEvent.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const c = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        time: data.time ?? null,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serialize(c) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteCalendarEvent(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.calendarEvent.findUnique({
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

    await prisma.calendarEvent.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}
