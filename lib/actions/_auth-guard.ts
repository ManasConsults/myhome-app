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
