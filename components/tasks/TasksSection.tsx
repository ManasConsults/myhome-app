"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, CheckCircle2, Circle, AlertCircle, ListTodo } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { tasks as initialTasks, type Task } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"
import { TaskList } from "@/components/dashboard/TaskList"
import { EventFilter } from "@/components/ui/EventFilter"

const TODAY = "2026-04-07"

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

  const formCardRef = useRef<HTMLDivElement>(null)
  const [taskList, setTaskList] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Chores")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [due, setDue] = useState("")
  const [eventId, setEventId] = useState("")

  useEffect(() => { setDue(new Date().toISOString().slice(0, 10)) }, [])

  useEffect(() => {
    const next = activeEvent
      ? initialTasks.filter((t) => t.eventId === activeEvent.id)
      : initialTasks.filter((t) => t.groupId === activeGroup.id)
    setTaskList(next)
  }, [activeGroup.id, activeEvent?.id])

  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const total = taskList.length
  const done = taskList.filter((t) => t.done).length
  const pending = taskList.filter((t) => !t.done).length
  const overdue = taskList.filter((t) => !t.done && t.due < TODAY).length

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

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    if (editingId) {
      setTaskList((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                title: title.trim(),
                category,
                priority,
                due,
                icon: CATEGORY_ICONS[category] ?? "📌",
                ...(eventId ? { eventId } : { eventId: undefined }),
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : t
        )
      )
    } else {
      const now = new Date().toISOString().slice(0, 10)
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: title.trim(),
        category,
        priority,
        done: false,
        due,
        icon: CATEGORY_ICONS[category] ?? "📌",
        groupId: activeGroup.id,
        ...(eventId ? { eventId } : {}),
        createdAt: now,
        updatedAt: now,
      }
      setTaskList((prev) => [newTask, ...prev])
    }

    closeForm()
  }

  function handleDelete(id: string) {
    setTaskList((prev) => prev.filter((t) => t.id !== id))
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
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Fix leaking tap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Category + Priority */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Priority</label>
                    <select
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

                {/* Due date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Due date</label>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Event (optional, only shown when group has events) */}
                {groupEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Event (optional)</label>
                    <select
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
                  <Button type="submit" size="sm">
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
