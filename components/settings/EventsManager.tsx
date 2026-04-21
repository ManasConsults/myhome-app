"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { events as initialEvents, groups, type AppEvent } from "@/lib/dummy-data"

const COLOR_MAP = {
  primary:     { bg: "bg-primary/10",     text: "text-primary",     dot: "bg-primary" },
  success:     { bg: "bg-success/10",     text: "text-success",     dot: "bg-success" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  warning:     { bg: "bg-warning/10",     text: "text-warning",     dot: "bg-warning" },
} as const

type ColorKey = keyof typeof COLOR_MAP
type SortKey = "startDate" | "name"

const COLOR_OPTIONS: ColorKey[] = ["primary", "success", "destructive", "warning"]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "startDate", label: "Start date" },
  { key: "name",      label: "Name" },
]

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function fmtDate(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`
}

type FormState = {
  name: string
  groupId: string
  startDate: string
  endDate: string
  icon: string
  color: ColorKey
}

const DEFAULT_FORM: FormState = {
  name: "",
  groupId: groups[0]?.id ?? "g1",
  startDate: "",
  endDate: "",
  icon: "🎉",
  color: "primary",
}

export function EventsManager() {
  const formRef = useRef<HTMLDivElement>(null)
  const [events, setEvents] = useState<AppEvent[]>(initialEvents)
  const [sortBy, setSortBy] = useState<SortKey>("startDate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  function openCreate() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setShowForm(true)
  }

  function openEdit(ev: AppEvent) {
    setEditingId(ev.id)
    setForm({
      name: ev.name,
      groupId: ev.groupId,
      startDate: ev.startDate,
      endDate: ev.endDate ?? "",
      icon: ev.icon,
      color: ev.color,
    })
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.startDate) return

    const today = new Date().toISOString().slice(0, 10)

    if (editingId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingId
            ? {
                ...ev,
                name: form.name.trim(),
                groupId: form.groupId,
                icon: form.icon.trim() || "🎉",
                color: form.color,
                startDate: form.startDate,
                updatedAt: today,
                ...(form.endDate ? { endDate: form.endDate } : { endDate: undefined }),
              }
            : ev
        )
      )
    } else {
      const newEvent: AppEvent = {
        id: `ev${Date.now()}`,
        groupId: form.groupId,
        name: form.name.trim(),
        icon: form.icon.trim() || "🎉",
        color: form.color,
        startDate: form.startDate,
        createdAt: today,
        updatedAt: today,
        ...(form.endDate ? { endDate: form.endDate } : {}),
      }
      setEvents((prev) => [...prev, newEvent])
    }

    closeForm()
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    setDeleteId(null)
  }

  function sortEvents(evs: AppEvent[]) {
    return [...evs].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortBy === "startDate") return a.startDate < b.startDate ? -dir : dir
      if (sortBy === "name") return dir * a.name.localeCompare(b.name)
      return 0
    })
  }

  // Group events by groupId for display
  const groupedEvents = groups.reduce<Record<string, AppEvent[]>>((acc, g) => {
    const grouped = events.filter((ev) => ev.groupId === g.id)
    if (grouped.length > 0) acc[g.id] = grouped
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage events scoped to your households.</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => (showForm ? closeForm() : openCreate())}
        >
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? "Cancel" : "Add event"}
        </Button>
      </div>

      <div ref={formRef}>
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="event-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden mb-4"
            >
              <Card>
                <CardContent className="p-4">
                  <form onSubmit={handleSave} className="flex flex-col gap-3">
                    <p className="text-sm font-medium">{editingId ? "Edit Event" : "New Event"}</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Wedding 2026"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          required
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Household *</label>
                        <select
                          value={form.groupId}
                          onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Start date *</label>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                          required
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">End date</label>
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Icon</label>
                        <input
                          type="text"
                          placeholder="🎉"
                          value={form.icon}
                          onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Color</label>
                        <select
                          value={form.color}
                          onChange={(e) => setForm((f) => ({ ...f, color: e.target.value as ColorKey }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {COLOR_OPTIONS.map((c) => (
                            <option key={c} value={c} className="capitalize">{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
                      <Button type="submit" size="sm">
                        {editingId ? "Save changes" : "Add event"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
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
                      setSortDir("asc")
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
          <div className="flex flex-col gap-5">
          {groups.map((g) => {
            const groupEvents = groupedEvents[g.id]
            if (!groupEvents) return null
            return (
              <div key={g.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{g.icon}</span>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{g.name}</p>
                </div>
                {sortEvents(groupEvents).map((ev) => {
                  const c = COLOR_MAP[ev.color]
                  const dateLabel = ev.endDate
                    ? `${fmtDate(ev.startDate)} → ${fmtDate(ev.endDate)}`
                    : `From ${fmtDate(ev.startDate)}`
                  const isDeleting = deleteId === ev.id
                  return (
                    <Card key={ev.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("size-10 rounded-xl flex items-center justify-center text-lg shrink-0", c.bg)}>
                            {ev.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{ev.name}</p>
                            <p className="text-xs text-muted-foreground">{dateLabel}</p>
                            {ev.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{ev.description}</p>
                            )}
                          </div>
                          <div className={cn("size-2.5 rounded-full shrink-0", c.dot)} />
                          {isDeleting ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-muted-foreground">Delete?</span>
                              <button
                                onClick={() => handleDelete(ev.id)}
                                className="px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="px-2 py-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => openEdit(ev)}
                                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label={`Edit ${ev.name}`}
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(ev.id)}
                                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label={`Delete ${ev.name}`}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          })}
        </div>
        </>
      )}
    </div>
  )
}
