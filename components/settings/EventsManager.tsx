"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Pencil, Trash2, ArrowUp, ArrowDown, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type AppEvent, type Group, type SharedEvent } from "@/lib/types"
import { useAuth } from "@/components/providers/AuthProvider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getEventsByUser, createEvent, updateEvent, deleteEvent, getSharedEventsByUser } from "@/lib/actions/events"
import { getGroups } from "@/lib/actions/groups"
import { EventMembersPanel } from "./EventMembersPanel"
import { useGroup } from "@/components/providers/GroupProvider"

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

const EMPTY_FORM: FormState = {
  name: "",
  groupId: "",
  startDate: "",
  endDate: "",
  icon: "🎉",
  color: "primary",
}

export function EventsManager() {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const router = useRouter()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLDivElement>(null)
  const { setActiveEvent } = useGroup()

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["groups", userId],
    queryFn: () => getGroups(),
    enabled: !!userId,
  })

  const { data: events = [] } = useQuery<AppEvent[]>({
    queryKey: ["events", userId],
    queryFn: () => getEventsByUser(),
    enabled: !!userId,
  })

  const { data: sharedEvents = [] } = useQuery<SharedEvent[]>({
    queryKey: ["shared-events", userId],
    queryFn: () => getSharedEventsByUser(),
    enabled: !!userId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["events", userId] })
  const createMutation = useMutation({ mutationFn: createEvent, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateEvent>[1] }) => updateEvent(id, data),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteEvent, onSuccess: invalidate })

  const [sortBy, setSortBy] = useState<SortKey>("startDate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedMembersId, setExpandedMembersId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, groupId: groups[0]?.id ?? "" })
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
    setForm(EMPTY_FORM)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.startDate || !form.groupId) return

    const payload = {
      groupId: form.groupId,
      name: form.name.trim(),
      icon: form.icon.trim() || "🎉",
      color: form.color,
      startDate: form.startDate,
      ...(form.endDate ? { endDate: form.endDate } : { endDate: undefined }),
    }

    if (editingId) {
      const result = await updateMutation.mutateAsync({ id: editingId, data: payload })
      if (result.success) closeForm()
    } else {
      const result = await createMutation.mutateAsync(payload)
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
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

  function handleGoToEvent(ev: SharedEvent) {
    setActiveEvent(ev.id)
    router.push("/finance")
  }

  const groupedEvents = groups.reduce<Record<string, AppEvent[]>>((acc, g) => {
    const grouped = events.filter((ev) => ev.groupId === g.id)
    if (grouped.length > 0) acc[g.id] = grouped
    return acc
  }, {})

  const hasAnyOwned = events.length > 0

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
                        <label htmlFor="event-name" className="text-xs text-muted-foreground font-medium">Name *</label>
                        <input
                          id="event-name"
                          type="text"
                          placeholder="e.g. Wedding 2026"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          required
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="event-household" className="text-xs text-muted-foreground font-medium">Household *</label>
                        <select
                          id="event-household"
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
                        <label htmlFor="event-start" className="text-xs text-muted-foreground font-medium">Start date *</label>
                        <input
                          id="event-start"
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                          required
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="event-end" className="text-xs text-muted-foreground font-medium">End date</label>
                        <input
                          id="event-end"
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="event-icon" className="text-xs text-muted-foreground font-medium">Icon</label>
                        <input
                          id="event-icon"
                          type="text"
                          placeholder="🎉"
                          value={form.icon}
                          onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="event-color" className="text-xs text-muted-foreground font-medium">Color</label>
                        <select
                          id="event-color"
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
                      <Button
                        type="submit"
                        size="sm"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
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

      {!hasAnyOwned && sharedEvents.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <>
          {hasAnyOwned && (
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
                        const membersExpanded = expandedMembersId === ev.id
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
                                      onClick={() => setExpandedMembersId(membersExpanded ? null : ev.id)}
                                      className={cn(
                                        "size-8 flex items-center justify-center rounded-lg transition-colors",
                                        membersExpanded
                                          ? "bg-primary/10 text-primary"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                      )}
                                      aria-label={`${membersExpanded ? "Hide" : "Show"} members for ${ev.name}`}
                                    >
                                      <Users className="size-3.5" />
                                    </button>
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

                              <AnimatePresence>
                                {membersExpanded && (
                                  <EventMembersPanel eventId={ev.id} eventName={ev.name} />
                                )}
                              </AnimatePresence>
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

          {/* Shared with me */}
          {sharedEvents.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shared with me</p>
              </div>
              {sharedEvents.map((ev) => {
                const c = COLOR_MAP[ev.color]
                const dateLabel = ev.endDate
                  ? `${fmtDate(ev.startDate)} → ${fmtDate(ev.endDate)}`
                  : `From ${fmtDate(ev.startDate)}`
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
                          <p className="text-xs text-muted-foreground">
                            {ev.groupIcon} {ev.groupName} · Shared by {ev.sharedByName}
                          </p>
                        </div>
                        <div className={cn("size-2.5 rounded-full shrink-0", c.dot)} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs shrink-0"
                          onClick={() => handleGoToEvent(ev)}
                        >
                          Go to event →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
