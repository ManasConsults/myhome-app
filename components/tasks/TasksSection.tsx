"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, CheckCircle2, Circle, AlertCircle, ListTodo } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Task } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { TaskList } from "@/components/dashboard/TaskList"
import { EventFilter } from "@/components/ui/EventFilter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/actions/tasks"

const CATEGORY_ICONS: Record<string, string> = {
  Chores: "🧹",
  Bills: "💳",
  Shopping: "🛒",
  Maintenance: "🔧",
  Health: "💊",
  Personal: "👤",
  Work: "💼",
  Other: "📌",
}

const CATEGORIES = ["Chores", "Bills", "Shopping", "Maintenance", "Health", "Personal", "Work", "Other"]

export function TasksSection() {
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events } = useGroup()
  const queryClient = useQueryClient()

  const formCardRef = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Chores")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [due, setDue] = useState("")
  const [eventId, setEventId] = useState("")

  useEffect(() => { setDue(new Date().toISOString().slice(0, 10)) }, [])
  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const { data: taskList = [] } = useQuery({
    queryKey: ["tasks", activeGroup.id, activeEvent?.id ?? null],
    queryFn: () => getTasks(activeGroup.id, activeEvent?.id),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks", activeGroup.id] })

  const createMutation = useMutation({ mutationFn: createTask, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">> }) =>
      updateTask(id, data),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteTask, onSuccess: invalidate })

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const today = new Date().toISOString().slice(0, 10)
  const total = taskList.length
  const done = taskList.filter((t) => t.done).length
  const pending = taskList.filter((t) => !t.done).length
  const overdue = taskList.filter((t) => !t.done && t.due < today).length

  const statsData = [
    { label: "Total", value: total, icon: ListTodo, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: done, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Pending", value: pending, icon: Circle, color: "text-warning", bg: "bg-warning/10" },
    { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ]

  function resetForm() {
    setTitle("")
    setCategory("Chores")
    setPriority("medium")
    setDue(new Date().toISOString().slice(0, 10))
    setEventId(activeEvent?.id ?? "")
  }

  function openCreate() {
    setEditingId(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(task: Task) {
    setEditingId(task.id)
    setTitle(task.title)
    setCategory(task.category)
    setPriority(task.priority)
    setDue(task.due)
    setEventId(task.eventId ?? "")
    setShowForm(true)
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    if (editingId) {
      const result = await updateMutation.mutateAsync({
        id: editingId,
        data: {
          title: title.trim(),
          category,
          priority,
          due,
          icon: CATEGORY_ICONS[category] ?? "📌",
          ...(eventId ? { eventId } : { eventId: undefined }),
        },
      })
      if (result.success) closeForm()
    } else {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        category,
        priority,
        done: false,
        due,
        icon: CATEGORY_ICONS[category] ?? "📌",
        groupId: activeGroup.id,
        ...(eventId ? { eventId } : {}),
      })
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsData.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <div className={cn("size-7 rounded-lg flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("size-3.5", s.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {groupEvents.length > 0 && (
        <EventFilter
          events={groupEvents}
          activeEvent={activeEvent}
          onSelect={(id) => id ? setActiveEvent(id) : clearActiveEvent()}
        />
      )}

      <Card ref={formCardRef} className="border-border/60">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => (showForm ? closeForm() : openCreate())}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "Add task"}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showForm && (
            <motion.form
              key="task-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3 border-b border-border/60">
                <p className="text-sm font-medium">{editingId ? "Edit task" : "New task"}</p>
                <div className="flex flex-col gap-1">
                  <label htmlFor="task-title" className="text-xs text-muted-foreground font-medium">Title</label>
                  <input
                    id="task-title"
                    type="text"
                    placeholder="e.g. Fix leaking tap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="task-category" className="text-xs text-muted-foreground font-medium">Category</label>
                    <select
                      id="task-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="task-priority" className="text-xs text-muted-foreground font-medium">Priority</label>
                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="task-due" className="text-xs text-muted-foreground font-medium">Due date</label>
                  <input
                    id="task-due"
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {groupEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="task-event" className="text-xs text-muted-foreground font-medium">Event (optional)</label>
                    <select
                      id="task-event"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">No event</option>
                      {groupEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.icon} {ev.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? "Save changes" : "Add task"}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <TaskList data={taskList} onEdit={openEdit} onDelete={handleDelete} />
    </>
  )
}
