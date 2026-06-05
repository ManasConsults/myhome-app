"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, LogOut, User, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/session"

const ROLE_PILL: Record<UserRole, { label: string; className: string }> = {
  admin:   { label: "Admin",   className: "bg-primary/10 text-primary" },
  manager: { label: "Manager", className: "bg-warning/10 text-warning" },
  user:    { label: "Member",  className: "bg-muted text-muted-foreground" },
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

export function ProfileDropdown() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [open])

  function toggleOpen() {
    setOpen((v) => !v)
  }

  const displayName = user?.name ?? ""
  const displayEmail = user?.email ?? ""
  const initials = getInitials(displayName)

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        aria-label="Open profile menu"
        className="rounded-full ring-2 ring-transparent hover:ring-primary/40 transition-all focus:outline-none focus:ring-primary/40"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-border/60 bg-card overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.25)]"
          >
            {/* Profile header */}
            <div className="px-4 py-4 flex items-start gap-3">
              <Avatar className="size-10 shrink-0 mt-0.5">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  {user?.role && (
                    <span className={cn("shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", ROLE_PILL[user.role].className)}>
                      {ROLE_PILL[user.role].label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                <button
                  onClick={() => { router.push("/settings/profile"); setOpen(false) }}
                  className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <User className="size-3" />
                  Edit profile
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => { router.push("/admin"); setOpen(false) }}
                    className="mt-1 flex items-center gap-1 text-xs text-warning hover:text-warning/80 transition-colors"
                  >
                    <ShieldCheck className="size-3" />
                    Admin panel
                  </button>
                )}
              </div>
            </div>

            <Separator />

            <div className="py-1">
              <button
                onClick={() => { router.push("/settings"); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <Settings className="size-4 text-muted-foreground" />
                Settings
              </button>
            </div>

            <Separator />

            <div className="py-1">
              <button
                onClick={() => { setOpen(false); logout() }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left text-muted-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
