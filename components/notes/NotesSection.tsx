"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, FileText, Pin, Tag, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Note } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { NotesGrid } from "@/components/notes/NotesGrid"
import { EventFilter } from "@/components/ui/EventFilter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getNotes, createNote, updateNote, deleteNote } from "@/lib/actions/notes"

const CATEGORIES = ["General", "Home", "Finance", "Health", "Work", "Personal", "Shopping", "Travel", "Other"]

const COLORS: { value: Note["color"]; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "blue",    label: "Blue" },
  { value: "green",   label: "Green" },
  { value: "yellow",  label: "Yellow" },
  { value: "rose",    label: "Rose" },
]

export function NotesSection() {
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events } = useGroup()
  const queryClient = useQueryClient()

  const formCardRef = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("General")
  const [color, setColor] = useState<Note["color"]>("default")
  const [pinned, setPinned] = useState(false)
  const [eventId, setEventId] = useState("")

  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const { data: noteList = [] } = useQuery({
    queryKey: ["notes", activeGroup.id, activeEvent?.id ?? null],
    queryFn: () => getNotes(activeGroup.id, activeEvent?.id),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notes", activeGroup.id] })

  const createMutation = useMutation({ mutationFn: createNote, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">> }) =>
      updateNote(id, data),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteNote, onSuccess: invalidate })

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const total = noteList.length
  const pinnedCount = noteList.filter((n) => n.pinned).length
  const categoryCount = new Set(noteList.map((n) => n.category)).size
  const thisWeek = noteList.filter((n) => n.updatedAt >= sevenDaysAgo).length

  const statsData = [
    { label: "Total Notes", value: total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pinned", value: pinnedCount, icon: Pin, color: "text-warning", bg: "bg-warning/10" },
    { label: "Categories", value: categoryCount, icon: Tag, color: "text-success", bg: "bg-success/10" },
    { label: "This Week", value: thisWeek, icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  ]

  function resetForm() {
    setTitle("")
    setContent("")
    setCategory("General")
    setColor("default")
    setPinned(false)
    setEventId(activeEvent?.id ?? "")
  }

  function openCreate() {
    setEditingId(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(note: Note) {
    setEditingId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setCategory(note.category)
    setColor(note.color)
    setPinned(note.pinned)
    setEventId(note.eventId ?? "")
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
    if (!title.trim() || !content.trim()) return

    if (editingId) {
      const result = await updateMutation.mutateAsync({
        id: editingId,
        data: {
          title: title.trim(),
          content: content.trim(),
          category,
          pinned,
          color,
          ...(eventId ? { eventId } : { eventId: undefined }),
        },
      })
      if (result.success) closeForm()
    } else {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        category,
        pinned,
        color,
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
            <CardTitle>Notes</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => (showForm ? closeForm() : openCreate())}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "Add note"}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showForm && (
            <motion.form
              key="note-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3 border-b border-border/60">
                <p className="text-sm font-medium">{editingId ? "Edit note" : "New note"}</p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Title</label>
                  <input
                    type="text"
                    placeholder="Note title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Content</label>
                  <textarea
                    placeholder="Write your note..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={3}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

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
                    <label className="text-xs text-muted-foreground font-medium">Color</label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value as Note["color"])}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pinned}
                    onClick={() => setPinned((v) => !v)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      pinned ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                      pinned ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                  <span className="text-sm font-medium">Pin note</span>
                </div>

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
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? "Save changes" : "Add note"}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <NotesGrid data={noteList} onEdit={openEdit} onDelete={handleDelete} />
    </>
  )
}
