"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, ShoppingCart, PackageCheck, DollarSign, List } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { type ShoppingList, type Category } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { EventFilter } from "@/components/ui/EventFilter"
import { SharedEventBanner } from "@/components/layout/SharedEventBanner"
import { ShoppingListCard } from "@/components/shopping/ShoppingListCard"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getShoppingLists,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
} from "@/lib/actions/shopping-lists"

export function ShoppingSection({ categories }: { categories: Category[] }) {
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events, isSharedEvent, activeEventGroupId } = useGroup()
  const queryClient = useQueryClient()
  const currency = activeGroup.currency
  const formCardRef = useRef<HTMLDivElement>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [listName, setListName] = useState("")
  const [listEventId, setListEventId] = useState("")

  useEffect(() => { setListEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const queryKey = isSharedEvent && activeEvent
    ? ["shopping-lists", "event", activeEvent.id]
    : ["shopping-lists", activeGroup.id, activeEvent?.id ?? null]

  const { data: lists = [] } = useQuery({
    queryKey,
    queryFn: isSharedEvent && activeEvent
      ? () => getShoppingLists("", activeEvent.id)
      : () => getShoppingLists(activeGroup.id, activeEvent?.id),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const createMutation = useMutation({ mutationFn: createShoppingList, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; eventId?: string | null } }) =>
      updateShoppingList(id, data),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteShoppingList, onSuccess: invalidate })

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const totalItems = lists.reduce((s, l) => s + l.itemCount, 0)
  const collectedCount = lists.reduce((s, l) => s + l.checkedCount, 0)
  const totalCost = lists.reduce((s, l) => s + l.estimatedTotal, 0)

  const statsData = [
    { label: "Total Items", value: totalItems, icon: ShoppingCart, color: "text-primary", bg: "bg-primary/10" },
    { label: "Collected", value: collectedCount, icon: PackageCheck, color: "text-success", bg: "bg-success/10" },
    { label: "Est. Total", value: formatCurrency(totalCost, currency, 0), icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
    { label: "Lists", value: lists.length, icon: List, color: "text-destructive", bg: "bg-destructive/10" },
  ]

  function resetForm() {
    setListName("")
    setListEventId(activeEvent?.id ?? "")
  }

  function openCreate() {
    setEditingId(null)
    resetForm()
    setShowForm(true)
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function openEdit(list: ShoppingList) {
    setEditingId(list.id)
    setListName(list.name)
    setListEventId(list.eventId ?? "")
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

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!listName.trim()) return

    if (editingId) {
      const result = await updateMutation.mutateAsync({
        id: editingId,
        data: {
          name: listName.trim(),
          eventId: listEventId || null,
        },
      })
      if (result.success) closeForm()
    } else {
      const result = await createMutation.mutateAsync({
        name: listName.trim(),
        groupId: activeEventGroupId,
        ...(isSharedEvent && activeEvent
          ? { eventId: activeEvent.id }
          : listEventId
          ? { eventId: listEventId }
          : {}),
      })
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
  }

  return (
    <>
      {/* Stats */}
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

      {/* Event filter */}
      {isSharedEvent ? (
        <SharedEventBanner />
      ) : (
        groupEvents.length > 0 && (
          <EventFilter
            events={groupEvents}
            activeEvent={activeEvent}
            onSelect={(id) => id ? setActiveEvent(id) : clearActiveEvent()}
          />
        )
      )}

      {/* Create / edit list form */}
      <Card ref={formCardRef} className="border-border/60">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Shopping Lists</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => (showForm ? closeForm() : openCreate())}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "New list"}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showForm && (
            <motion.form
              key="list-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3 border-b border-border/60">
                <p className="text-sm font-medium">{editingId ? "Edit list" : "New list"}</p>

                <div className="flex flex-col gap-1">
                  <label htmlFor="list-name" className="text-xs text-muted-foreground font-medium">
                    List name
                  </label>
                  <input
                    id="list-name"
                    type="text"
                    placeholder="e.g. Weekly Groceries"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {!isSharedEvent && groupEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="list-event" className="text-xs text-muted-foreground font-medium">
                      Event (optional)
                    </label>
                    <select
                      id="list-event"
                      value={listEventId}
                      onChange={(e) => setListEventId(e.target.value)}
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
                  <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? "Save changes" : "Create list"}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      {/* List cards */}
      <AnimatePresence>
        {lists.map((list, i) => (
          <motion.div
            key={list.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <ShoppingListCard
              list={list}
              categories={categories}
              currency={currency}
              isSharedEvent={isSharedEvent}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {lists.length === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-12 text-center"
        >
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
            <ShoppingCart className="size-7 text-muted-foreground/50" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">No shopping lists yet</p>
            <p className="text-xs text-muted-foreground">Create a list to start adding items</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Create your first list
          </Button>
        </motion.div>
      )}
    </>
  )
}
