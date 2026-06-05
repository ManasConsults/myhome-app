"use client"

import { type CalendarEvent, type Category } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const COLOR_DOT_CLASSES: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground",
}

function getCalendarMeta(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  return { firstDay, totalDays }
}

export function CalendarGrid({ data, categories }: { data: CalendarEvent[]; categories: Category[] }) {
  const dotColorMap = Object.fromEntries(categories.map((c) => [c.name, c.color]))
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayDay = now.getDate()
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" })

  const { firstDay, totalDays } = getCalendarMeta(year, month)

  const eventsByDay = new Map<number, CalendarEvent[]>()
  data.forEach((e) => {
    if (e.date.startsWith(monthKey)) {
      const day = parseInt(e.date.split("-")[2], 10)
      const existing = eventsByDay.get(day) ?? []
      eventsByDay.set(day, [...existing, e])
    }
  })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const rows: (number | null)[][] = []
  for (let r = 0; r < cells.length / 7; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7))
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base font-semibold">{monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-muted-foreground py-1.5"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((day, ci) => {
                const dayEvents = day ? (eventsByDay.get(day) ?? []) : []
                const isToday = day === todayDay
                const dots = dayEvents.slice(0, 3)

                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="flex flex-col items-center justify-start h-10 md:h-12 pt-1 gap-0.5"
                  >
                    {day !== null && (
                      <>
                        <span
                          className={cn(
                            "size-7 flex items-center justify-center text-sm rounded-full leading-none",
                            isToday
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-foreground"
                          )}
                        >
                          {day}
                        </span>
                        {dots.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            {dots.map((e) => (
                              <span
                                key={e.id}
                                className={cn("size-1 rounded-full", COLOR_DOT_CLASSES[dotColorMap[e.category]] ?? "bg-muted-foreground")}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
