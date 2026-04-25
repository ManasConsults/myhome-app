"use client"

import { motion } from "framer-motion"
import { Users, Settings, Database, ChevronRight, ShieldCheck, UserCheck, User, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getUsers, type UserRecord } from "@/lib/actions/auth"

const SECTIONS = [
  {
    href: "/admin/users",
    icon: Users,
    title: "Users",
    description: "Manage accounts, change roles, remove users",
  },
  {
    href: "/admin/settings",
    icon: Settings,
    title: "App Settings",
    description: "Default currency, timezone, and theme colour",
  },
  {
    href: "/admin/data",
    icon: Database,
    title: "Data",
    description: "View record counts and reset group data",
  },
]

export default function AdminOverviewPage() {
  const router = useRouter()

  const { data: users = [] } = useQuery<UserRecord[]>({
    queryKey: ["adminUsers"],
    queryFn: getUsers,
  })

  const adminCount   = users.filter((u) => u.role === "admin").length
  const managerCount = users.filter((u) => u.role === "manager").length
  const memberCount  = users.filter((u) => u.role === "user").length
  const pendingCount = users.filter((u) => u.status === "pending").length

  return (
    <>
      <AdminHeader title="Admin Panel" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-3xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col gap-5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Total users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3 text-primary" />
                  <p className="text-xs text-muted-foreground">Admins</p>
                </div>
                <p className="text-2xl font-bold">{adminCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="size-3 text-warning" />
                  <p className="text-xs text-muted-foreground">Managers</p>
                </div>
                <p className="text-2xl font-bold">{managerCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <User className="size-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <p className="text-2xl font-bold">{memberCount}</p>
              </CardContent>
            </Card>
            {pendingCount > 0 && (
              <Card className="col-span-2 sm:col-span-4">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Clock className="size-3 text-warning" />
                    <p className="text-xs text-muted-foreground">Pending approval</p>
                  </div>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {SECTIONS.map((s) => (
              <Card
                key={s.href}
                className="cursor-pointer"
                onClick={() => router.push(s.href)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <s.icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{s.title}</p>
                      {s.href === "/admin/users" && pendingCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning shrink-0">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  )
}
