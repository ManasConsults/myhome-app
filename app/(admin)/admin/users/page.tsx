"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import {
  SEED_USER,
  getRegisteredUsers,
  updateUserRole,
  deleteUser,
  type DummyUser,
  type UserRole,
} from "@/lib/dummy-users"
import { cn } from "@/lib/utils"

const ROLE_PILL: Record<UserRole, { label: string; className: string }> = {
  admin:   { label: "Admin",   className: "bg-primary/10 text-primary" },
  manager: { label: "Manager", className: "bg-warning/10 text-warning" },
  user:    { label: "Member",  className: "bg-muted text-muted-foreground" },
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DummyUser[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setUsers([SEED_USER, ...getRegisteredUsers()])
  }, [])

  function handleRoleChange(userId: string, role: UserRole) {
    updateUserRole(userId, role)
    setUsers([SEED_USER, ...getRegisteredUsers()])
  }

  function handleDelete(userId: string) {
    deleteUser(userId)
    setDeleteId(null)
    setUsers([SEED_USER, ...getRegisteredUsers()])
  }

  return (
    <>
      <AdminHeader title="Users" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 max-w-3xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-base font-semibold">
                All users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 flex flex-col gap-3">
              {users.map((u) => {
                const isSeed = u.id === SEED_USER.id
                const isDeleting = deleteId === u.id

                return (
                  <div key={u.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    {/* Avatar */}
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name / email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        {isSeed && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                            Seed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">Joined {u.createdAt}</p>
                    </div>

                    {/* Role */}
                    <div className="shrink-0">
                      {isSeed ? (
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", ROLE_PILL[u.role].className)}>
                          {ROLE_PILL[u.role].label}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="h-11 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="user">Member</option>
                        </select>
                      )}
                    </div>

                    {/* Delete */}
                    <div className="shrink-0">
                      <AnimatePresence mode="wait">
                        {isDeleting ? (
                          <motion.div
                            key="confirm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            <span className="text-xs text-muted-foreground">Delete?</span>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-3 py-2.5 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-3 py-2.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              No
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="trash"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => !isSeed && setDeleteId(u.id)}
                            disabled={isSeed}
                            className={cn(
                              "size-8 flex items-center justify-center rounded-lg transition-colors",
                              isSeed
                                ? "text-muted-foreground/30 cursor-not-allowed"
                                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            )}
                            aria-label={`Delete ${u.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  )
}
