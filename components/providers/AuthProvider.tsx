"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { type SessionPayload } from "@/lib/session"
import { logoutAction } from "@/lib/actions/auth"

interface AuthContextValue {
  user: SessionPayload | null
  setUser: (payload: SessionPayload) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUserState] = useState<SessionPayload | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<SessionPayload | null>)
      .then((data) => { if (data) setUserState(data) })
      .catch(() => {})
  }, [])

  function setUser(payload: SessionPayload) {
    setUserState(payload)
  }

  function logout() {
    setUserState(null)
    logoutAction().then(() => router.push("/login"))
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
