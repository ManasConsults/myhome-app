"use client"

import { useSession, signOut } from "next-auth/react"
import type { UserRole } from "@/lib/session"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export function useAuth() {
  const { data: session } = useSession()
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
      }
    : null

  return {
    user,
    logout: () => signOut({ callbackUrl: "/login" }),
  }
}
