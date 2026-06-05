"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

// proxy.ts is the primary gate — this is a client-side safety net
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "admin") {
      router.replace("/")
    }
  }, [session, status, router])

  // Render a blank shell while auth hydrates — proxy.ts is the real gate
  if (status === "loading") return <div className="flex flex-col min-h-dvh" />

  return (
    <div className="flex flex-col min-h-dvh">
      {children}
    </div>
  )
}
