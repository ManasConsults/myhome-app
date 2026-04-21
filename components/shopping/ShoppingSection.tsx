"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, ShoppingCart, PackageCheck, DollarSign, Store } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils"
import { shoppingItems, type ShoppingItem } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"
import { ShoppingList } from "@/components/dashboard/ShoppingList"
import { EventFilter } from "@/components/ui/EventFilter"

const CATEGORIES = ["Produce", "Dairy", "Meat", "Bakery", "Frozen", "Drinks", "Snacks", "Cleaning", "Personal Care", "Other"]

const CATEGORY_ICONS: Record<string, string> = {
  Produce: "🥦",
  Dairy: "🥛",
  Meat: "🥩",
  Bakery: "🍞",
  Frozen: "🧊",
  Drinks: "🧃",
  Snacks: "🍿",
  Cleaning: "🧹",
  "Personal Care": "🧴",
  Other: "🛍️",
}

export function ShoppingSection() {
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events } = useGroup()
  const currency = activeGroup.currency

  const formCardRef = useRef<HTMLDivElement>(null)
  const [itemList, setItemList] = useState<ShoppingItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Produce")
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState("pcs")
  const [price, setPrice] = useState("")
  const [store, setStore] = useState("")
  const [eventId, setEventId] = useState("")

  useEffect(() => {
    const next = activeEvent
      ? shoppingItems.filter((i) => i.eventId === activeEvent.id)
      : shoppingItems.filter((i) => i.groupId === activeGroup.id)
    setItemList(next)
  }, [activeGroup.id, activeEvent?.id])

  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const total = itemList.length
  const collectedCount = itemList.filter((i) => i.checked).length
  const totalCost = itemList.reduce((sum, i) => sum + i.estimatedPrice, 0)
  const storeCount = new Set(itemList.map((i) => i.store)).size

  const statsData = [
    { label: "Total Items", value: total, icon: ShoppingCart, color: "text-primary", bg: "bg-primary/10" },
    { label: "Collected", value: collectedCount, icon: PackageCheck, color: "text-success", bg: "bg-success/10" },
    { label: "Est. Total", value: formatCurrency(totalCost, currency, 0), icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
    { label: "Stores", value: storeCount, icon: Store, color: "text-destructive", bg: "bg-destructive/10" },
  ]

  function resetForm() {
    setName("")
    setCategory("Produce")
    setQuantity("1")
    setUnit("pcs")
    setPrice("")
    setStore("")
    setEventId(activeEvent?.id ?? "")
  }

  function openCreate() {
    setEditingId(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(item: ShoppingItem) {
    setEditingId(item.id)
    setName(item.name)
    setCategory(item.category)
    setQuantity(String(item.quantity))
    setUnit(item.unit)
    setPrice(item.estimatedPrice > 0 ? String(item.estimatedPrice) : "")
    setStore(item.store)
    setEventId(item.eventId ?? "")
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

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !store.trim()) return

    if (editingId) {
      setItemList((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                name: name.trim(),
                category,
                quantity: parseFloat(quantity) || 1,
                unit: unit.trim() || "pcs",
                estimatedPrice: parseFloat(price) || 0,
                store: store.trim(),
                icon: CATEGORY_ICONS[category] ?? "🛍️",
                ...(eventId ? { eventId } : { eventId: undefined }),
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : it
        )
      )
    } else {
      const now = new Date().toISOString().slice(0, 10)
      const newItem: ShoppingItem = {
        id: `shop-${Date.now()}`,
        name: name.trim(),
        category,
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim() || "pcs",
        estimatedPrice: parseFloat(price) || 0,
        checked: false,
        store: store.trim(),
        icon: CATEGORY_ICONS[category] ?? "🛍️",
        groupId: activeGroup.id,
        ...(eventId ? { eventId } : {}),
        createdAt: now,
        updatedAt: now,
      }
      setItemList((prev) => [newItem, ...prev])
    }

    closeForm()
  }

  function handleDelete(id: string) {
    setItemList((prev) => prev.filter((it) => it.id !== id))
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
            <CardTitle>Shopping List</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => (showForm ? closeForm() : openCreate())}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "Add item"}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showForm && (
            <motion.form
              key="shopping-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3 border-b border-border/60">
                <p className="text-sm font-medium">{editingId ? "Edit item" : "New item"}</p>

                {/* Name + Store */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Item name</label>
                    <input
                      type="text"
                      placeholder="e.g. Milk"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Store</label>
                    <input
                      type="text"
                      placeholder="e.g. Woolworths"
                      value={store}
                      onChange={(e) => setStore(e.target.value)}
                      required
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Category */}
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

                {/* Quantity + Unit + Price */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Qty</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Unit</label>
                    <input
                      type="text"
                      placeholder="pcs"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Est. price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-9 pl-7 pr-3 w-full rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Event (optional, only when group has events) */}
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
                  <Button type="submit" size="sm">
                    {editingId ? "Save changes" : "Add item"}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <ShoppingList data={itemList} onEdit={openEdit} onDelete={handleDelete} />
    </>
  )
}
