"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"

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
    createdAt: toDateStr(c.createdAt),
    updatedAt: toDateStr(c.updatedAt),
  }
}

export async function getCalendarEvents(groupId: string, eventId?: string): Promise<CalendarEvent[]> {
  const events = await prisma.calendarEvent.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { date: "asc" },
  })
  return events.map(serialize)
}

export async function createCalendarEvent(
  data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: CalendarEvent } | { success: false; error: string }> {
  try {
    const c = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        time: data.time ?? null,
        category: data.category,
        allDay: data.allDay,
        icon: data.icon,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serialize(c) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateCalendarEvent(
  id: string,
  data: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: CalendarEvent } | { success: false; error: string }> {
  try {
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
    return { success: false, error: String(e) }
  }
}

export async function deleteCalendarEvent(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.calendarEvent.delete({ where: { id } })
    return { success: true }
  } catch { return { success: false } }
}
