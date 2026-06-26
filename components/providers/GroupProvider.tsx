"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import { getGroups } from "@/lib/actions/groups"
import { getEventsByUser, getSharedEventsByUser } from "@/lib/actions/events"
import type { Group, AppEvent, SharedEvent } from "@/lib/types"

type GroupContextValue = {
  groups: Group[]
  events: AppEvent[]
  sharedEvents: SharedEvent[]
  activeGroup: Group
  activeEvent: AppEvent | null
  isSharedEvent: boolean
  activeEventGroupId: string
  setActiveGroup: (id: string) => void
  setActiveEvent: (id: string) => void
  clearActiveEvent: () => void
}

const GroupContext = createContext<GroupContextValue | null>(null)

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ""

  const { data: groups = [], isPending: groupsPending } = useQuery({
    queryKey: ["groups", userId],
    queryFn: () => getGroups(),
    enabled: !!userId,
  })

  const { data: events = [] } = useQuery({
    queryKey: ["events", userId],
    queryFn: () => getEventsByUser(),
    enabled: !!userId,
  })

  const { data: sharedEvents = [] } = useQuery({
    queryKey: ["shared-events", userId],
    queryFn: () => getSharedEventsByUser(),
    enabled: !!userId,
  })

  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null)
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null)

  // Hydrate active group/event from localStorage once groups are loaded
  useEffect(() => {
    if (groups.length === 0) return
    const allEvents = [...events, ...sharedEvents]
    try {
      const storedGroup = localStorage.getItem("myhome-active-group")
      const valid = groups.find((g) => g.id === storedGroup)
      setActiveGroupIdState(valid ? valid.id : groups[0].id)

      const storedEvent = localStorage.getItem("myhome-active-event")
      if (storedEvent && allEvents.find((e) => e.id === storedEvent)) {
        setActiveEventIdState(storedEvent)
      } else {
        setActiveEventIdState(null)
      }
    } catch {
      setActiveGroupIdState(groups[0].id)
    }
  }, [groups, events, sharedEvents])

  function setActiveGroup(id: string) {
    setActiveGroupIdState(id)
    setActiveEventIdState(null)
    try {
      localStorage.setItem("myhome-active-group", id)
      localStorage.removeItem("myhome-active-event")
    } catch {}
  }

  function setActiveEvent(id: string) {
    // Check owned events first
    const ownedEv = events.find((e) => e.id === id)
    if (ownedEv) {
      setActiveEventIdState(id)
      setActiveGroupIdState(ownedEv.groupId)
      try {
        localStorage.setItem("myhome-active-event", id)
        localStorage.setItem("myhome-active-group", ownedEv.groupId)
      } catch {}
      return
    }
    // Shared event — don't switch activeGroup
    const sharedEv = sharedEvents.find((e) => e.id === id)
    if (sharedEv) {
      setActiveEventIdState(id)
      try {
        localStorage.setItem("myhome-active-event", id)
      } catch {}
    }
  }

  function clearActiveEvent() {
    setActiveEventIdState(null)
    try { localStorage.removeItem("myhome-active-event") } catch {}
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0]
  const allEvents = [...events, ...sharedEvents]
  const activeEvent = allEvents.find((e) => e.id === activeEventId) ?? null
  const isSharedEvent = activeEvent !== null && sharedEvents.some((e) => e.id === activeEvent.id)
  const activeEventGroupId = isSharedEvent
    ? (activeEvent as SharedEvent).groupId
    : activeGroup?.id ?? ""

  // Still fetching — don't render yet (avoids flash of no-group state)
  if (groupsPending && !!userId) return null

  // Loaded, but this user belongs to no groups yet
  if (!activeGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        {user?.role === "admin" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">No households yet. Create one to get started.</p>
            <Link href="/settings/groups" className="text-sm text-primary hover:underline font-medium">
              Create your first household →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Your account is active, but you haven&apos;t been added to a group yet.
            <br />Ask your admin to add you to a household.
          </p>
        )}
      </div>
    )
  }

  return (
    <GroupContext.Provider value={{
      groups,
      events,
      sharedEvents,
      activeGroup,
      activeEvent,
      isSharedEvent,
      activeEventGroupId,
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
