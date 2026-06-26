"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { EventMember } from "@/lib/types"
import { unstable_rethrow } from "next/navigation"
import { requireGroupOwner, requireEventMember } from "./_auth-guard"
import { resend, FROM_ADDRESS, APP_URL } from "@/lib/email/resend"
import { EventInvite } from "@/emails/EventInvite"

function serialize(
  m: { id: string; eventId: string; userId: string; createdAt: Date; user: { name: string; email: string } },
): EventMember {
  return {
    id: m.id,
    eventId: m.eventId,
    userId: m.userId,
    userName: m.user.name,
    userEmail: m.user.email,
    createdAt: toDateStr(m.createdAt),
  }
}

function formatEventDate(startDate: string, endDate?: string | null): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  function fmt(iso: string) {
    const [, m, d] = iso.split("-")
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`
  }
  return endDate ? `${fmt(startDate)} → ${fmt(endDate)}` : `From ${fmt(startDate)}`
}

export async function getEventMembers(eventId: string): Promise<EventMember[]> {
  const existing = await prisma.appEvent.findUnique({
    where: { id: eventId },
    select: { groupId: true },
  })
  if (!existing) return []
  await requireGroupOwner(existing.groupId)
  const members = await prisma.eventMember.findMany({
    where: { eventId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })
  return members.map(serialize)
}

export async function addEventMember(
  eventId: string,
  email: string,
): Promise<{ success: true; data: EventMember } | { success: false; error: string }> {
  try {
    const event = await prisma.appEvent.findUnique({
      where: { id: eventId },
      select: {
        name: true,
        icon: true,
        startDate: true,
        endDate: true,
        groupId: true,
        group: { select: { userId: true, name: true, user: { select: { name: true } } } },
      },
    })
    if (!event) return { success: false, error: "Event not found" }
    const session = await requireGroupOwner(event.groupId)

    const target = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true, status: true },
    })
    if (!target) return { success: false, error: "No user found with that email" }
    if (target.status !== "active") return { success: false, error: "That user's account is not active" }
    if (target.id === event.group.userId) return { success: false, error: "That user is already the event owner" }

    const alreadyMember = await prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId, userId: target.id } },
    })
    if (alreadyMember) return { success: false, error: "That user is already a member of this event" }

    const member = await prisma.eventMember.create({
      data: { eventId, userId: target.id },
      include: { user: { select: { name: true, email: true } } },
    })

    // Send invitation email — fire-and-forget (don't fail the action if email fails)
    resend.emails.send({
      from: FROM_ADDRESS,
      to: target.email,
      subject: `You've been added to ${event.icon} ${event.name} on MyHome`,
      react: EventInvite({
        recipientName: target.name,
        inviterName: session.user.name ?? event.group.user.name,
        eventName: event.name,
        eventIcon: event.icon,
        eventDateLabel: formatEventDate(
          toDateStr(event.startDate),
          event.endDate ? toDateStr(event.endDate) : null,
        ),
        groupName: event.group.name,
        appUrl: APP_URL,
      }),
    }).catch(() => {
      // Email failure is non-fatal — member was already added to DB
    })

    return { success: true, data: serialize(member) }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function removeEventMember(
  eventId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const event = await prisma.appEvent.findUnique({
      where: { id: eventId },
      select: { groupId: true },
    })
    if (!event) return { success: false, error: "Event not found" }
    await requireGroupOwner(event.groupId)
    await prisma.eventMember.deleteMany({ where: { eventId, userId } })
    return { success: true }
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function getEventMemberCount(eventId: string): Promise<number> {
  await requireEventMember(eventId)
  return prisma.eventMember.count({ where: { eventId } })
}
