"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, CheckCircle2, Circle, AlertCircle, ListTodo } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Task, type Category } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { useAuth } from "@/components/providers/AuthProvider"
import { TaskList } from "@/components/dashboard/TaskList"
import { EventFilter } from "@/components/ui/EventFilter"
import { SharedEventBanner } from "@/components/layout/SharedEventBanner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTasks, getTasksByEvent, createTask, updateTask, deleteTask } from "@/lib/actions/tasks"

export function TasksSection({ categories }: { categories: Category[] }) {
  const iconMap = Object.fromEntries(categories.map((c) => [c.name, c.icon]))
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events, isSharedEvent, activeEventGroupId } = useGroup()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const formCardRef = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState(() => categories[0]?.name ?? "")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [due, setDue] = useState("")
  const [eventId, setEventId] = useState("")

  useEffect(() => { setDue(new Date().toISOString().slice(0, 10)) }, [])
  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const queryKey = isSharedEvent && activeEvent
    ? ["tasks", "event", activeEvent.id]
    : ["tasks", activeGroup.id, activeEvent?.id ?? null]

  const { data: taskList = [] } = useQuery({
    queryKey,
    queryFn: isSharedEvent && activeEvent
      ? () => getTasksByEvent(activeEvent.id)
      : () => getTasks(activeGroup.id, activeEvent?.id),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

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
    setCategory(categories[0]?.name ?? "")
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
          icon: iconMap[category] ?? "📌",
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
        icon: iconMap[category] ?? "📌",
        groupId: activeEventGroupId,
        ...(isSharedEvent && activeEvent ? { eventId: activeEvent.id } : eventId ? { eventId } : {}),
      })
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    if (isSharedEvent) {
      const task = taskList.find((t) => t.id === id)
      if (task?.createdBy !== user?.id) return
    }
    await deleteMutation.mutateAsync(id)
  }

  const canDeleteTask = (task: Task) => !isSharedEvent || task.createdBy === user?.id

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

      {isSharedEvent ? (
        <SharedEventBanner />
      ) : (
        groupEvents.length > 0 && (
          <EventFilter
            events={groupEvents}
            activeEvent={activeEvent}
            onSelect={(id) => id ? setActiveEvent(id) : clearActiveEvent()}
          />
        )
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
                      {categories.map((c) => <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>)}
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

                {!isSharedEvent && groupEvents.length > 0 && (
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

      <TaskList
        data={taskList}
        onEdit={openEdit}
        onDelete={handleDelete}
        canDelete={canDeleteTask}
      />
    </>
  )
}
