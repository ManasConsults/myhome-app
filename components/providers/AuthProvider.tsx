"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  type SessionPayload,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encodeSession,
  decodeSession,
} from "@/lib/session"

interface AuthContextValue {
  user: SessionPayload | null
  setUser: (payload: SessionPayload) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUserState] = useState<SessionPayload | null>(null)

  // Read session cookie after mount to avoid SSR hydration mismatch
  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((r) => r.startsWith(`${SESSION_COOKIE}=`))
    if (match) {
      const value = match.split("=").slice(1).join("=")
      const payload = decodeSession(value)
      if (payload) {
        setUserState(payload)
      }
    }
  }, [])

  function setUser(payload: SessionPayload) {
    setUserState(payload)
    document.cookie = `${SESSION_COOKIE}=${encodeSession(payload)}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`
  }

  function logout() {
    setUserState(null)
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`
    router.push("/login")
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
