"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { groups as seedGroups, events as allEvents, type Group, type AppEvent } from "@/lib/dummy-data"
import { useAuth } from "@/components/providers/AuthProvider"

// localStorage key for groups created by non-seed users
const USER_GROUPS_KEY = (userId: string) => `myhome-user-groups-${userId}`

function loadUserGroups(userId: string): Group[] {
  try {
    const raw = localStorage.getItem(USER_GROUPS_KEY(userId))
    return raw ? (JSON.parse(raw) as Group[]) : []
  } catch {
    return []
  }
}

function saveUserGroups(userId: string, groups: Group[]) {
  try {
    // Only persist groups that belong to this user and aren't in the seed set
    const seedIds = new Set(seedGroups.map((g) => g.id))
    const toSave = groups.filter((g) => g.userId === userId && !seedIds.has(g.id))
    localStorage.setItem(USER_GROUPS_KEY(userId), JSON.stringify(toSave))
  } catch {}
}

function buildDefaultGroup(userId: string): Group {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: `g-${userId}`,
    name: "My Home",
    type: "household",
    icon: "🏠",
    color: "primary",
    currency: "AUD",
    isDefault: true,
    userId,
    createdAt: today,
    updatedAt: today,
  }
}

type GroupContextValue = {
  groups: Group[]
  events: AppEvent[]
  activeGroup: Group
  activeEvent: AppEvent | null
  setActiveGroup: (id: string) => void
  setActiveEvent: (id: string) => void
  clearActiveEvent: () => void
  addGroup: (group: Group) => void
  updateGroup: (group: Group) => void
  removeGroup: (id: string) => void
}

const GroupContext = createContext<GroupContextValue | null>(null)

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.userId ?? ""

  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null)
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null)

  // Build the group list for the current user when userId changes
  useEffect(() => {
    const seed = seedGroups.filter((g) => g.userId === userId)
    const local = loadUserGroups(userId)
    let combined = [...seed, ...local]

    // New users with no groups get a default household
    if (combined.length === 0) {
      const def = buildDefaultGroup(userId)
      combined = [def]
      saveUserGroups(userId, combined)
    }

    setAllGroups(combined)

    // Restore persisted active group, defaulting to first
    try {
      const storedGroup = localStorage.getItem("myhome-active-group")
      const valid = combined.find((g) => g.id === storedGroup)
      setActiveGroupIdState(valid ? valid.id : combined[0].id)

      const storedEvent = localStorage.getItem("myhome-active-event")
      if (storedEvent && allEvents.find((e) => e.id === storedEvent)) {
        setActiveEventIdState(storedEvent)
      } else {
        setActiveEventIdState(null)
      }
    } catch {
      setActiveGroupIdState(combined[0].id)
    }
  }, [userId])

  function setActiveGroup(id: string) {
    setActiveGroupIdState(id)
    setActiveEventIdState(null)
    try {
      localStorage.setItem("myhome-active-group", id)
      localStorage.removeItem("myhome-active-event")
    } catch {}
  }

  function setActiveEvent(id: string) {
    const ev = allEvents.find((e) => e.id === id)
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

  function addGroup(group: Group) {
    const next = [...allGroups, group]
    setAllGroups(next)
    saveUserGroups(userId, next)
  }

  function updateGroup(group: Group) {
    const next = allGroups.map((g) => (g.id === group.id ? group : g))
    setAllGroups(next)
    saveUserGroups(userId, next)
  }

  function removeGroup(id: string) {
    const next = allGroups.filter((g) => g.id !== id)
    setAllGroups(next)
    saveUserGroups(userId, next)
    if (activeGroupId === id) {
      const fallback = next[0]
      if (fallback) setActiveGroup(fallback.id)
    }
  }

  const activeGroup = allGroups.find((g) => g.id === activeGroupId) ?? allGroups[0]
  const activeEvent = allEvents.find((e) => e.id === activeEventId) ?? null

  // Wait for hydration before rendering children that depend on group state
  if (!activeGroup) return null

  return (
    <GroupContext.Provider value={{
      groups: allGroups,
      events: allEvents,
      activeGroup,
      activeEvent,
      setActiveGroup,
      setActiveEvent,
      clearActiveEvent,
      addGroup,
      updateGroup,
      removeGroup,
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
