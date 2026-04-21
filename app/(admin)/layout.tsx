"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"

// proxy.ts is the primary gate — this is a client-side safety net
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // user is null during hydration — only redirect once it resolves
    if (user !== null && user.role !== "admin") {
      router.replace("/")
    }
  }, [user, router])

  // Render a blank shell while auth hydrates — proxy.ts is the real gate
  if (user === null) return <div className="flex flex-col min-h-screen" />

  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  )
}
