"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")
  return session
}

/** Verifies the calling user owns the given group. Returns the session on success. */
export async function requireGroupOwner(groupId: string) {
  const session = await requireSession()
  const group = await prisma.group.findFirst({
    where: { id: groupId, userId: session.user.id },
    select: { id: true },
  })
  if (!group) throw new Error("Forbidden")
  return session
}

/**
 * Allows group owner OR event member access.
 * Returns session, the event's groupId, and whether the caller is the group owner.
 * Use for all event-scoped reads and writes by guests.
 */
export async function requireEventMember(eventId: string) {
  const session = await requireSession()
  const event = await prisma.appEvent.findUnique({
    where: { id: eventId },
    select: { groupId: true },
  })
  if (!event) throw new Error("Forbidden")

  const ownsGroup = await prisma.group.findFirst({
    where: { id: event.groupId, userId: session.user.id },
    select: { id: true },
  })
  if (ownsGroup) return { session, groupId: event.groupId, isOwner: true as const }

  const membership = await prisma.eventMember.findFirst({
    where: { eventId, userId: session.user.id },
    select: { id: true },
  })
  if (!membership) throw new Error("Forbidden")
  return { session, groupId: event.groupId, isOwner: false as const }
}
