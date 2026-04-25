"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { type Task } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQuery } from "@tanstack/react-query"
import { getTasks } from "@/lib/actions/tasks"

type Filter = "all" | "pending" | "done"
type SortKey = "updatedAt" | "createdAt" | "due" | "priority"

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Done", value: "done" },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
  { key: "due",       label: "Due" },
  { key: "priority",  label: "Priority" },
]

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 }

const priorityStyles = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
}

interface TaskListProps {
  data?: Task[]
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
}

export function TaskList({ data, onEdit, onDelete }: TaskListProps) {
  const { activeGroup } = useGroup()
  const { data: fetchedTasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks", activeGroup.id, null],
    queryFn: () => getTasks(activeGroup.id),
    enabled: !data,
  })
  const source = data ?? fetchedTasks
  const [filter, setFilter] = useState<Filter>("all")
  const [sortBy, setSortBy] = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(source.filter((t) => t.done).map((t) => t.id))
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = source
    .filter((t) => {
      if (filter === "pending") return !checked.has(t.id)
      if (filter === "done") return checked.has(t.id)
      return true
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortBy === "updatedAt") return a.updatedAt < b.updatedAt ? -dir : dir
      if (sortBy === "createdAt") return a.createdAt < b.createdAt ? -dir : dir
      if (sortBy === "due") return a.due < b.due ? -dir : dir
      if (sortBy === "priority") return dir * (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
      return 0
    })

  const completedCount = checked.size
  const progress = Math.round((completedCount / source.length) * 100)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">All Tasks</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedCount} of {source.length} completed
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all duration-150",
                  filter === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="text-xs text-muted-foreground">Sort:</span>
          {SORT_OPTIONS.map((s) => {
            const active = sortBy === s.key
            return (
              <button
                key={s.key}
                onClick={() => {
                  if (active) {
                    setSortDir((d) => d === "asc" ? "desc" : "asc")
                  } else {
                    setSortBy(s.key)
                    setSortDir("desc")
                  }
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {s.label}
                {active && (sortDir === "asc"
                  ? <ArrowUp className="size-3" />
                  : <ArrowDown className="size-3" />
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-3">
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <AnimatePresence mode="wait">
          <motion.ul
            key={filter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                {filter === "pending" ? "All tasks complete!" : "No tasks yet"}
              </li>
            ) : (
              filtered.map((task, i) => {
                const done = checked.has(task.id)
                const isDeleting = deleteId === task.id
                return (
                  <motion.li
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                    className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0"
                  >
                    <button
                      onClick={() =>
                        setChecked((prev) => {
                          const next = new Set(prev)
                          if (next.has(task.id)) next.delete(task.id)
                          else next.add(task.id)
                          return next
                        })
                      }
                      className={cn(
                        "shrink-0 transition-colors",
                        done ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                      )}
                    >
                      {done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        done && "line-through text-muted-foreground"
                      )}>
                        {task.icon} {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{task.category}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          Due {new Date(task.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Priority badge + actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isDeleting && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs border-0", priorityStyles[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                      )}

                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Delete?</span>
                          <button
                            onClick={() => { onDelete?.(task.id); setDeleteId(null) }}
                            className="px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(task)}
                              className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              aria-label="Edit task"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => setDeleteId(task.id)}
                              className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              aria-label="Delete task"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.li>
                )
              })
            )}
          </motion.ul>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
