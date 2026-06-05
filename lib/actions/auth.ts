"use server"

import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import type { UserRole, UserStatus } from "@/lib/session"

export type UserRecord = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

function isSeedUser(user: { email: string }) {
  return user.email === "demo@myhome.app"
}

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "admin") throw new Error("Forbidden")
  return session
}

export async function getLoginBlockReason(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) return null
  if (user.status === "pending") return "Your account is awaiting admin approval."
  if (user.status === "rejected") return "Your account request was not approved. Contact the admin."
  return null
}

export async function registerAction(data: {
  name: string
  email: string
  password: string
}): Promise<{ success: true; isAdmin: boolean } | { success: false; error: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } })
  if (existing) return { success: false, error: "An account with this email already exists." }

  const hashed = await bcrypt.hash(data.password, 12)
  const isFirstUser = (await prisma.user.count()) === 0

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashed,
      role: isFirstUser ? "admin" : "user",
      status: isFirstUser ? "active" : "pending",
    },
  })

  if (isFirstUser) {
    await prisma.group.create({
      data: {
        name: "My Home",
        icon: "🏠",
        color: "primary",
        currency: "USD",
        isDefault: true,
        userId: user.id,
      },
    })
  }

  return { success: true, isAdmin: isFirstUser }
}

export async function getUsers(): Promise<UserRecord[]> {
  await requireAdmin()
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } })
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    status: u.status as UserStatus,
    createdAt: u.createdAt.toISOString().slice(0, 10),
  }))
}

export async function approveUser(userId: string): Promise<{ success: boolean }> {
  await requireAdmin()
  try {
    await prisma.user.update({ where: { id: userId }, data: { status: "active" } })
    return { success: true }
  } catch { return { success: false } }
}

export async function rejectUser(userId: string): Promise<{ success: boolean }> {
  await requireAdmin()
  try {
    await prisma.user.update({ where: { id: userId }, data: { status: "rejected" } })
    return { success: true }
  } catch { return { success: false } }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean }> {
  await requireAdmin()
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || isSeedUser(user)) return { success: false }
    await prisma.user.update({ where: { id: userId }, data: { role } })
    return { success: true }
  } catch { return { success: false } }
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  await requireAdmin()
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || isSeedUser(user)) return { success: false }
    await prisma.user.delete({ where: { id: userId } })
    return { success: true }
  } catch { return { success: false } }
}
