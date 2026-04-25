"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/components/providers/AuthProvider"
import { getGroups } from "@/lib/actions/groups"
import { getEventsByUser } from "@/lib/actions/events"
import type { Group, AppEvent } from "@/lib/dummy-data"

type GroupContextValue = {
  groups: Group[]
  events: AppEvent[]
  activeGroup: Group
  activeEvent: AppEvent | null
  setActiveGroup: (id: string) => void
  setActiveEvent: (id: string) => void
  clearActiveEvent: () => void
}

const GroupContext = createContext<GroupContextValue | null>(null)

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.userId ?? ""

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", userId],
    queryFn: () => getGroups(userId),
    enabled: !!userId,
  })

  const { data: events = [] } = useQuery({
    queryKey: ["events", userId],
    queryFn: () => getEventsByUser(userId),
    enabled: !!userId,
  })

  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null)
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null)

  // Hydrate active group/event from localStorage once groups are loaded
  useEffect(() => {
    if (groups.length === 0) return
    try {
      const storedGroup = localStorage.getItem("myhome-active-group")
      const valid = groups.find((g) => g.id === storedGroup)
      setActiveGroupIdState(valid ? valid.id : groups[0].id)

      const storedEvent = localStorage.getItem("myhome-active-event")
      if (storedEvent && events.find((e) => e.id === storedEvent)) {
        setActiveEventIdState(storedEvent)
      } else {
        setActiveEventIdState(null)
      }
    } catch {
      setActiveGroupIdState(groups[0].id)
    }
  }, [groups, events])

  function setActiveGroup(id: string) {
    setActiveGroupIdState(id)
    setActiveEventIdState(null)
    try {
      localStorage.setItem("myhome-active-group", id)
      localStorage.removeItem("myhome-active-event")
    } catch {}
  }

  function setActiveEvent(id: string) {
    const ev = events.find((e) => e.id === id)
    if (!ev) return
    setActiveEventIdState(id)
    setActiveGroupIdState(ev.groupId)
    try {
      localStorage.setItem("myhome-active-event", id)
      localStorage.setItem("myhome-active-group", ev.groupId)
    } catch {}
  }

  function clearActiveEvent() {
    setActiveEventIdState(null)
    try { localStorage.removeItem("myhome-active-event") } catch {}
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0]
  const activeEvent = events.find((e) => e.id === activeEventId) ?? null

  if (!activeGroup) return null

  return (
    <GroupContext.Provider value={{
      groups,
      events,
      activeGroup,
      activeEvent,
      setActiveGroup,
      setActiveEvent,
      clearActiveEvent,
    }}>
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup() {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error("useGroup must be used within GroupProvider")
  return ctx
}
