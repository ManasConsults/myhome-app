"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { requireGroupOwner } from "./_auth-guard"

function serialize(t: Awaited<ReturnType<typeof prisma.task.findFirst>>): Task {
  if (!t) throw new Error("Task not found")
  return {
    id: t.id,
    title: t.title,
    category: t.category,
    priority: t.priority as Task["priority"],
    done: t.done,
    due: toDateStr(t.due),
    icon: t.icon,
    groupId: t.groupId,
    eventId: t.eventId ?? undefined,
    createdAt: toDateStr(t.createdAt),
    updatedAt: toDateStr(t.updatedAt),
  }
}

export async function getTasks(groupId: string, eventId?: string): Promise<Task[]> {
  await requireGroupOwner(groupId)
  const tasks = await prisma.task.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { updatedAt: "desc" },
  })
  return tasks.map(serialize)
}

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Task } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    const t = await prisma.task.create({
      data: {
        title: data.title,
        category: data.category,
        priority: data.priority,
        done: data.done,
        due: new Date(data.due),
        icon: data.icon,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serialize(t) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateTask(
  id: string,
  data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Task } | { success: false; error: string }> {
  try {
    const existing = await prisma.task.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const t = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        due: data.due ? new Date(data.due) : undefined,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serialize(t) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.task.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false }
    await requireGroupOwner(existing.groupId)
    await prisma.task.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}
