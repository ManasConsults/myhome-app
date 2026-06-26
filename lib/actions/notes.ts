"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { Note } from "@/lib/types"
import { unstable_rethrow } from "next/navigation"
import { requireGroupOwner, requireEventMember } from "./_auth-guard"

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
    createdBy: n.createdBy ?? undefined,
    createdAt: toDateStr(n.createdAt),
    updatedAt: toDateStr(n.updatedAt),
  }
}

export async function getNotes(groupId: string, eventId?: string): Promise<Note[]> {
  await requireGroupOwner(groupId)
  if (eventId) {
    const event = await prisma.appEvent.findFirst({ where: { id: eventId, groupId }, select: { id: true } })
    if (!event) throw new Error("Forbidden")
  }
  const notes = await prisma.note.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  })
  return notes.map(serialize)
}

export async function getNotesByEvent(eventId: string): Promise<Note[]> {
  await requireEventMember(eventId)
  const notes = await prisma.note.findMany({
    where: { eventId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  })
  return notes.map(serialize)
}

export async function createNote(
  data: Omit<Note, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Note } | { success: false; error: string }> {
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

    const n = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        pinned: data.pinned,
        color: data.color,
        groupId: resolvedGroupId,
        eventId: data.eventId ?? null,
        createdBy,
      },
    })
    return { success: true, data: serialize(n) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateNote(
  id: string,
  data: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Note } | { success: false; error: string }> {
  try {
    const existing = await prisma.note.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const n = await prisma.note.update({
      where: { id },
      data: { ...data, eventId: data.eventId ?? null },
    })
    return { success: true, data: serialize(n) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteNote(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.note.findUnique({
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

    await prisma.note.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}
