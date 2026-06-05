"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, CheckCircle2, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQuery } from "@tanstack/react-query"
import { getTasks } from "@/lib/actions/tasks"
import type { Task } from "@/lib/types"

const priorityStyles = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
}

export function TaskOverview() {
  const { activeGroup } = useGroup()

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks", activeGroup.id, null],
    queryFn: () => getTasks(activeGroup.id),
  })

  const completed = tasks.filter((t) => t.done).length
  const total = tasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <CardTitle className="text-base font-semibold">Tasks</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
          View all <ArrowUpRight data-icon="inline-end" />
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{completed} of {total} completed</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <motion.ul variants={container} initial="hidden" animate="visible" className="space-y-0">
          {tasks.slice(0, 5).map((task) => (
            <motion.li
              key={task.id}
              variants={item}
              className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
            >
              <div className={cn("shrink-0 transition-colors", task.done ? "text-primary" : "text-muted-foreground/40")}>
                {task.done
                  ? <CheckCircle2 className="size-5" />
                  : <Circle className="size-5" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", task.done && "line-through text-muted-foreground")}>
                  {task.icon} {task.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Due {new Date(task.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <Badge variant="outline" className={cn("text-xs border-0 shrink-0", priorityStyles[task.priority])}>
                {task.priority}
              </Badge>
            </motion.li>
          ))}
        </motion.ul>
      </CardContent>
    </Card>
  )
}
