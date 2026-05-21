"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { Note } from "@/lib/types"

function serialize(n: Awaited<ReturnType<typeof prisma.note.findFirst>>): Note {
  if (!n) throw new Error("Note not found")
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    category: n.category,
    pinned: n.pinned,
    color: n.color as Note["color"],
    groupId: n.groupId,
    eventId: n.eventId ?? undefined,
    createdAt: toDateStr(n.createdAt),
    updatedAt: toDateStr(n.updatedAt),
  }
}

export async function getNotes(groupId: string, eventId?: string): Promise<Note[]> {
  const notes = await prisma.note.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  })
  return notes.map(serialize)
}

export async function createNote(
  data: Omit<Note, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Note } | { success: false; error: string }> {
  try {
    const n = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        pinned: data.pinned,
        color: data.color,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serialize(n) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateNote(
  id: string,
  data: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Note } | { success: false; error: string }> {
  try {
    const n = await prisma.note.update({
      where: { id },
      data: { ...data, eventId: data.eventId ?? null },
    })
    return { success: true, data: serialize(n) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteNote(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.note.delete({ where: { id } })
    return { success: true }
  } catch { return { success: false } }
}
