"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Calendar, CalendarDays, Clock, Cake } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type CalendarEvent, type Category } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { CalendarGrid } from "@/components/calendar/CalendarGrid"
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents"
import { EventFilter } from "@/components/ui/EventFilter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCalendarEvents, createCalendarEvent } from "@/lib/actions/calendar"

export function CalendarSection({ categories }: { categories: Category[] }) {
  const iconMap = Object.fromEntries(categories.map((c) => [c.name, c.icon]))
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events } = useGroup()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [category, setCategory] = useState(() => categories[0]?.name ?? "")
  const [allDay, setAllDay] = useState(true)
  const [time, setTime] = useState("09:00")
  const [eventId, setEventId] = useState("")

  useEffect(() => { setDate(new Date().toISOString().slice(0, 10)) }, [])
  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const { data: eventList = [] } = useQuery({
    queryKey: ["calendar", activeGroup.id, activeEvent?.id ?? null],
    queryFn: () => getCalendarEvents(activeGroup.id, activeEvent?.id),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["calendar", activeGroup.id] })

  const createMutation = useMutation({ mutationFn: createCalendarEvent, onSuccess: invalidate })

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const todayStr = new Date().toISOString().slice(0, 10)
  const thisMonthCount = eventList.filter((e) => e.date.startsWith(thisMonth)).length
  const todayCount = eventList.filter((e) => e.date === todayStr).length
  const appointments = eventList.filter((e) => e.category === "appointment").length
  const birthdays = eventList.filter((e) => e.category === "birthday").length

  const statsData = [
    { label: "This Month", value: thisMonthCount, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Today", value: todayCount, icon: CalendarDays, color: "text-success", bg: "bg-success/10" },
    { label: "Appointments", value: appointments, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Birthdays", value: birthdays, icon: Cake, color: "text-destructive", bg: "bg-destructive/10" },
  ]

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return

    const result = await createMutation.mutateAsync({
      title: title.trim(),
      date,
      ...(!allDay && time ? { time } : {}),
      category,
      allDay,
      icon: iconMap[category] ?? "📅",
      groupId: activeGroup.id,
      ...(eventId ? { eventId } : {}),
    })

    if (result.success) {
      setTitle("")
      setDate(new Date().toISOString().slice(0, 10))
      setCategory(categories[0]?.name ?? "")
      setAllDay(true)
      setTime("09:00")
      setEventId(activeEvent?.id ?? "")
      setShowForm(false)
    }
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

      <Card className="border-border/60">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Calendar</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "Add event"}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showForm && (
            <motion.form
              key="cal-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAdd}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3 border-b border-border/60">

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Doctor appointment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ""}{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allDay}
                    onClick={() => setAllDay((v) => !v)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      allDay ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                      allDay ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                  <span className="text-sm font-medium">All day</span>
                  <AnimatePresence>
                    {!allDay && (
                      <motion.div
                        key="time"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="ml-auto"
                      >
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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

                <Button
                  type="submit"
                  size="sm"
                  className="self-end"
                  disabled={createMutation.isPending}
                >
                  Add event
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <div className="lg:col-span-2">
          <CalendarGrid data={eventList} categories={categories} />
        </div>
        <div>
          <UpcomingEvents data={eventList} categories={categories} />
        </div>
      </div>
    </>
  )
}
