"use client"

import { calendarEvents, type CalendarEvent } from "@/lib/dummy-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// April 2026: starts on Wednesday (index 3), 30 days
const MONTH_START_DAY = 3
const TOTAL_DAYS = 30
const TODAY_DAY = 1
const MONTH = "2026-04"

function getDotColor(category: string): string {
  switch (category) {
    case "appointment":
      return "bg-primary"
    case "reminder":
      return "bg-warning"
    case "birthday":
    case "holiday":
      return "bg-success"
    case "social":
      return "bg-muted-foreground"
    default:
      return "bg-muted-foreground"
  }
}

export function CalendarGrid({ data }: { data?: CalendarEvent[] }) {
  const source = data ?? calendarEvents
  // Map day number -> events
  const eventsByDay = new Map<number, CalendarEvent[]>()
  source.forEach((e) => {
    if (e.date.startsWith(MONTH)) {
      const day = parseInt(e.date.split("-")[2], 10)
      const existing = eventsByDay.get(day) ?? []
      eventsByDay.set(day, [...existing, e])
    }
  })

  // Build 5 rows × 7 cols = 35 cells
  // cells[0..MONTH_START_DAY-1] are empty, then days 1..30
  const cells: (number | null)[] = []
  for (let i = 0; i < MONTH_START_DAY; i++) cells.push(null)
  for (let d = 1; d <= TOTAL_DAYS; d++) cells.push(d)
  // Pad to 35
  while (cells.length < 35) cells.push(null)

  const rows: (number | null)[][] = []
  for (let r = 0; r < 5; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7))
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base font-semibold">April 2026</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {/* Day headers */}
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

        {/* Calendar rows */}
        <div className="flex flex-col gap-0.5">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((day, ci) => {
                const dayEvents = day ? (eventsByDay.get(day) ?? []) : []
                const isToday = day === TODAY_DAY
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
                                className={cn("size-1 rounded-full", getDotColor(e.category))}
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
