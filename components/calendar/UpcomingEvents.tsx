"use client"

import { useState } from "react"
import { type CalendarEvent } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SortKey = "date" | "updatedAt" | "createdAt"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date",      label: "Date" },
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
]

function formatEventDate(date: string, time?: string): string {
  const d = new Date(date + "T00:00:00")
  const month = d.toLocaleString("en-US", { month: "short" })
  const day = d.getDate()
  if (!time) return `${month} ${day} · All day`
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  const mins = m === 0 ? "00" : String(m).padStart(2, "0")
  return `${month} ${day} · ${hour}:${mins} ${period}`
}

function getCategoryBadgeClass(category: CalendarEvent["category"]): string {
  switch (category) {
    case "appointment":
      return "bg-primary/10 text-primary border-primary/20"
    case "birthday":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "holiday":
      return "bg-success/10 text-success border-success/20"
    case "reminder":
      return "bg-warning/10 text-warning border-warning/20"
    case "social":
      return "bg-primary/10 text-primary border-primary/20"
  }
}

function getCategoryLabel(category: CalendarEvent["category"]): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function UpcomingEvents({ data }: { data: CalendarEvent[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = data
    .filter((e) => e.date >= today)
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortBy === "date") return a.date < b.date ? -dir : dir
      if (sortBy === "updatedAt") return a.updatedAt < b.updatedAt ? -dir : dir
      if (sortBy === "createdAt") return a.createdAt < b.createdAt ? -dir : dir
      return 0
    })
    .slice(0, 6)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          Upcoming Events
        </CardTitle>
        <div className="flex items-center gap-1.5 mt-2">
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
                    setSortDir(s.key === "date" ? "asc" : "desc")
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
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col gap-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
          )}
          {upcoming.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
            >
              <span className="text-xl leading-none mt-0.5 shrink-0">{event.icon}</span>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatEventDate(event.date, event.time)}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${getCategoryBadgeClass(event.category)}`}
              >
                {getCategoryLabel(event.category)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
