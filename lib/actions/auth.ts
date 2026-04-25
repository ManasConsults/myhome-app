"use server"

import { prisma } from "@/lib/db/prisma"
import type { SessionPayload, UserRole, UserStatus } from "@/lib/dummy-users"

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

export async function loginAction(
  email: string,
  password: string,
): Promise<{ success: true; user: SessionPayload } | { success: false; error: string }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

  if (!user || user.password !== password) {
    if (user?.status === "pending") return { success: false, error: "Your account is awaiting admin approval." }
    if (user?.status === "rejected") return { success: false, error: "Your account request was not approved. Contact the admin." }
    return { success: false, error: "Invalid email or password." }
  }

  if (user.status !== "active") {
    if (user.status === "pending") return { success: false, error: "Your account is awaiting admin approval." }
    return { success: false, error: "Your account request was not approved. Contact the admin." }
  }

  return {
    success: true,
    user: { userId: user.id, name: user.name, email: user.email, role: user.role as UserRole },
  }
}

export async function registerAction(data: {
  name: string
  email: string
  password: string
}): Promise<{ success: true } | { success: false; error: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } })
  if (existing) return { success: false, error: "An account with this email already exists." }

  await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password,
      role: "user",
      status: "pending",
    },
  })
  return { success: true }
}

export async function getUsers(): Promise<UserRecord[]> {
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
  try {
    await prisma.user.update({ where: { id: userId }, data: { status: "active" } })
    return { success: true }
  } catch { return { success: false } }
}

export async function rejectUser(userId: string): Promise<{ success: boolean }> {
  try {
    await prisma.user.update({ where: { id: userId }, data: { status: "rejected" } })
    return { success: true }
  } catch { return { success: false } }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || isSeedUser(user)) return { success: false }
    await prisma.user.update({ where: { id: userId }, data: { role } })
    return { success: true }
  } catch { return { success: false } }
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || isSeedUser(user)) return { success: false }
    await prisma.user.delete({ where: { id: userId } })
    return { success: true }
  } catch { return { success: false } }
}
