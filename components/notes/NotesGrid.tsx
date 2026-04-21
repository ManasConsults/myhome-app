"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { notes, type Note } from "@/lib/dummy-data"
import { Badge } from "@/components/ui/badge"
import { Pin, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SortKey = "updatedAt" | "createdAt" | "title"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
  { key: "title",     label: "Title" },
]

function getNoteColorClass(color: Note["color"]): string {
  switch (color) {
    case "blue":
      return "bg-primary/5 border-primary/20"
    case "green":
      return "bg-success/5 border-success/20"
    case "yellow":
      return "bg-warning/5 border-warning/20"
    case "rose":
      return "bg-destructive/5 border-destructive/20"
    default:
      return "bg-card border-border/60"
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleString("en-US", { month: "short", day: "numeric" })
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
}

interface NotesGridProps {
  data?: Note[]
  onEdit?: (note: Note) => void
  onDelete?: (id: string) => void
}

export function NotesGrid({ data, onEdit, onDelete }: NotesGridProps) {
  const source = data ?? notes
  const [sortBy, setSortBy] = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function sortFn(a: Note, b: Note) {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "updatedAt") return a.updatedAt < b.updatedAt ? -dir : dir
    if (sortBy === "createdAt") return a.createdAt < b.createdAt ? -dir : dir
    if (sortBy === "title") return dir * a.title.localeCompare(b.title)
    return 0
  }

  const sorted = [
    ...source.filter((n) => n.pinned).sort(sortFn),
    ...source.filter((n) => !n.pinned).sort(sortFn),
  ]

  return (
    <div className="flex flex-col gap-3">
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
      <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {sorted.map((note) => (
        <motion.div
          key={note.id}
          variants={cardVariants}
          className={cn(
            "rounded-xl border p-4 flex flex-col gap-2 cursor-default hover:scale-[1.02] transition-transform",
            getNoteColorClass(note.color)
          )}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">{note.title}</p>
            {note.pinned && (
              <Badge variant="secondary" className="shrink-0 flex items-center gap-1 text-xs px-1.5 py-0.5">
                <Pin className="size-3" />
                Pinned
              </Badge>
            )}
          </div>

          {/* Content */}
          <p className="text-xs text-muted-foreground line-clamp-3 mt-1 leading-relaxed">
            {note.content}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-1 gap-2">
            <span className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5 shrink-0">
              {note.category}
            </span>

            {deleteId === note.id ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Delete?</span>
                <button
                  onClick={() => { onDelete?.(note.id); setDeleteId(null) }}
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
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(note)}
                    className="flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Edit note"
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => setDeleteId(note.id)}
                    className="flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
    </div>
  )
}
