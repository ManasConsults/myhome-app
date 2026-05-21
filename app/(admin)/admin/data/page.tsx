"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { useAuth } from "@/components/providers/AuthProvider"
import { useQuery } from "@tanstack/react-query"
import { getGroups, getGroupDataCounts } from "@/lib/actions/groups"
import { cn } from "@/lib/utils"
import type { Group } from "@/lib/types"

function GroupDataCard({ group }: { group: Group }) {
  const { data: counts } = useQuery({
    queryKey: ["groupDataCounts", group.id],
    queryFn: () => getGroupDataCounts(group.id),
  })

  const [resetId, setResetId] = useState<string | null>(null)
  const isResetting = resetId === group.id

  const rows = counts ? [
    { label: "Tasks",          count: counts.tasks },
    { label: "Shopping items", count: counts.shoppingItems },
    { label: "Notes",          count: counts.notes },
    { label: "Calendar events",count: counts.calendarEvents },
    { label: "Expenses",       count: counts.expenses },
    { label: "Income entries", count: counts.incomes },
    { label: "Budgets",        count: counts.budgets },
    { label: "Loans",          count: counts.loans },
    { label: "Meal plan days", count: counts.mealPlanDays },
  ] : []

  const total = rows.reduce((s, r) => s + r.count, 0)

  return (
    <Card>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>{group.icon}</span>
            {group.name}
            {group.location && (
              <span className="text-xs font-normal text-muted-foreground">· {group.location}</span>
            )}
          </CardTitle>

          <AnimatePresence mode="wait">
            {isResetting ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 shrink-0"
              >
                <span className="text-xs text-muted-foreground">Clear localStorage?</span>
                <button
                  onClick={() => {
                    try {
                      Object.keys(localStorage).filter((k) => k.startsWith("myhome-")).forEach((k) => localStorage.removeItem(k))
                    } catch {}
                    window.location.reload()
                  }}
                  className="px-3 py-2.5 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setResetId(null)}
                  className="px-3 py-2.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  No
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setResetId(group.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <RotateCcw className="size-3.5" />
                Reset UI
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {!counts ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 py-1 border-b border-border/40">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className={cn("text-xs font-semibold tabular-nums", row.count === 0 ? "text-muted-foreground/50" : "text-foreground")}>
                    {row.count}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Total records: <span className="font-semibold text-foreground">{total}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDataPage() {
  const { user } = useAuth()
  const userId = user?.userId ?? "user-1"

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["groups", userId],
    queryFn: () => getGroups(userId),
    enabled: !!userId,
  })

  return (
    <>
      <AdminHeader title="Data" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 max-w-3xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted-foreground">
            Record counts are live from the database. "Reset UI" clears <code className="text-xs bg-muted px-1 py-0.5 rounded">myhome-*</code> localStorage keys (active group, theme, nav state) and reloads.
          </p>

          {groups.map((g) => (
            <GroupDataCard key={g.id} group={g} />
          ))}
        </motion.div>
      </main>
    </>
  )
}
