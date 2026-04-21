"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { groups, tasks, shoppingItems, notes, calendarEvents, expenses, incomes, userBudgets, loans, weeklyMealPlan, type Group } from "@/lib/dummy-data"
import { cn } from "@/lib/utils"

type DataRow = { label: string; count: number }

function getGroupCounts(groupId: string): DataRow[] {
  return [
    { label: "Tasks",          count: tasks.filter((i) => i.groupId === groupId).length },
    { label: "Shopping items", count: shoppingItems.filter((i) => i.groupId === groupId).length },
    { label: "Notes",          count: notes.filter((i) => i.groupId === groupId).length },
    { label: "Calendar events",count: calendarEvents.filter((i) => i.groupId === groupId).length },
    { label: "Expenses",       count: expenses.filter((i) => i.groupId === groupId).length },
    { label: "Income entries", count: incomes.filter((i) => i.groupId === groupId).length },
    { label: "Budgets",        count: userBudgets.filter((i) => i.groupId === groupId).length },
    { label: "Loans",          count: loans.filter((i) => i.groupId === groupId).length },
    { label: "Meal plan days", count: weeklyMealPlan.filter((i) => i.groupId === groupId).length },
  ]
}

function resetAllData() {
  // Wipe all myhome-* localStorage keys, then reload so seed data re-hydrates
  try {
    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith("myhome-"))
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch {}
  window.location.reload()
}

export default function AdminDataPage() {
  const [resetId, setResetId] = useState<string | null>(null)

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
            Record counts are from seed data. Resetting a group wipes all <code className="text-xs bg-muted px-1 py-0.5 rounded">myhome-*</code> localStorage keys and reloads the app to a clean state.
          </p>

          {groups.map((g: Group) => {
            const counts = getGroupCounts(g.id)
            const total  = counts.reduce((s, r) => s + r.count, 0)
            const isResetting = resetId === g.id

            return (
              <Card key={g.id}>
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span>{g.icon}</span>
                      {g.name}
                      {g.location && (
                        <span className="text-xs font-normal text-muted-foreground">· {g.location}</span>
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
                          <span className="text-xs text-muted-foreground">Reset all data?</span>
                          <button
                            onClick={() => resetAllData()}
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
                          onClick={() => setResetId(g.id)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <RotateCcw className="size-3.5" />
                          Reset
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    {counts.map((row) => (
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
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      </main>
    </>
  )
}
