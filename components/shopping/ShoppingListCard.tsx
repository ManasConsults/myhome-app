"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Pencil, Trash2, Plus, ShoppingCart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils"
import { type ShoppingList, type ShoppingItem, type Category } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { useAuth } from "@/components/providers/AuthProvider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getShoppingItemsByList,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
} from "@/lib/actions/shopping"

interface ShoppingListCardProps {
  list: ShoppingList
  categories: Category[]
  currency: string
  isSharedEvent: boolean
  onEdit: (list: ShoppingList) => void
  onDelete: (id: string) => void
}

export function ShoppingListCard({
  list,
  categories,
  currency,
  isSharedEvent,
  onEdit,
  onDelete,
}: ShoppingListCardProps) {
  const iconMap = Object.fromEntries(categories.map((c) => [c.name, c.icon]))
  const { events, sharedEvents } = useGroup()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const allEvents = [...events, ...sharedEvents]
  const listEvent = list.eventId ? allEvents.find((e) => e.id === list.eventId) : null

  const [expanded, setExpanded] = useState(false)
  const [deletingList, setDeletingList] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

  const toggle = (id: string) =>
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const [name, setName] = useState("")
  const [category, setCategory] = useState(() => categories[0]?.name ?? "")
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState("pcs")
  const [price, setPrice] = useState("")
  const [store, setStore] = useState("")

  const itemQueryKey = ["shopping-list-items", list.id]
  const listQueryPrefix = ["shopping-lists"]

  const { data: items = [], isPending: itemsPending } = useQuery({
    queryKey: itemQueryKey,
    queryFn: () => getShoppingItemsByList(list.id),
    enabled: expanded,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: itemQueryKey })
    queryClient.invalidateQueries({ queryKey: listQueryPrefix })
  }

  const createMutation = useMutation({ mutationFn: createShoppingItem, onSuccess: invalidateAll })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">> }) =>
      updateShoppingItem(id, data),
    onSuccess: invalidateAll,
  })
  const deleteMutation = useMutation({ mutationFn: deleteShoppingItem, onSuccess: invalidateAll })

  function resetItemForm() {
    setName("")
    setCategory(categories[0]?.name ?? "")
    setQuantity("1")
    setUnit("pcs")
    setPrice("")
    setStore("")
  }

  function openCreate() {
    setEditingItemId(null)
    resetItemForm()
    setShowItemForm(true)
  }

  function openEdit(item: ShoppingItem) {
    setEditingItemId(item.id)
    setName(item.name)
    setCategory(item.category)
    setQuantity(String(item.quantity))
    setUnit(item.unit)
    setPrice(item.estimatedPrice > 0 ? String(item.estimatedPrice) : "")
    setStore(item.store)
    setShowItemForm(true)
  }

  function closeItemForm() {
    setShowItemForm(false)
    setEditingItemId(null)
    resetItemForm()
  }

  async function handleSaveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !store.trim()) return

    if (editingItemId) {
      const result = await updateMutation.mutateAsync({
        id: editingItemId,
        data: {
          name: name.trim(),
          category,
          quantity: parseFloat(quantity) || 1,
          unit: unit.trim() || "pcs",
          estimatedPrice: parseFloat(price) || 0,
          store: store.trim(),
          icon: iconMap[category] ?? "🛍️",
          listId: list.id,
        },
      })
      if (result.success) closeItemForm()
    } else {
      const result = await createMutation.mutateAsync({
        name: name.trim(),
        category,
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim() || "pcs",
        estimatedPrice: parseFloat(price) || 0,
        checked: false,
        store: store.trim(),
        icon: iconMap[category] ?? "🛍️",
        groupId: list.groupId,
        listId: list.id,
      })
      if (result.success) closeItemForm()
    }
  }

  async function handleDeleteItem(id: string) {
    if (isSharedEvent) {
      const item = items.find((i) => i.id === id)
      if (item?.createdBy !== user?.id) return
    }
    await deleteMutation.mutateAsync(id)
  }

  const canDeleteItem = (item: ShoppingItem) => !isSharedEvent || item.createdBy === user?.id

  const progress = list.itemCount > 0 ? Math.round((list.checkedCount / list.itemCount) * 100) : 0

  return (
    <Card className="border-border/60 overflow-hidden">
      {/* List header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={expanded ? "Collapse list" : "Expand list"}
          aria-expanded={expanded}
        >
          <ChevronRight className={cn("size-4 transition-transform duration-200", expanded && "rotate-90")} />
        </button>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{list.name}</p>
            {listEvent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                {listEvent.icon} {listEvent.name}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {list.checkedCount}/{list.itemCount} collected
            {list.estimatedTotal > 0 && (
              <> · {formatCurrency(list.estimatedTotal, currency, 0)} est.</>
            )}
          </p>
        </button>

        {/* Progress bar — desktop */}
        {list.itemCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-7 text-right">{progress}%</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <AnimatePresence mode="wait">
            {deletingList ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1"
              >
                <span className="text-xs text-muted-foreground">Delete list?</span>
                <button
                  onClick={() => { onDelete(list.id); setDeletingList(false) }}
                  className="px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setDeletingList(false)}
                  className="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  No
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-0.5"
              >
                <button
                  onClick={() => onEdit(list)}
                  className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={`Edit ${list.name}`}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setDeletingList(true)}
                  className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={`Delete ${list.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60">
              {itemsPending ? (
                <div className="py-8 flex items-center justify-center">
                  <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <ShoppingCart className="size-7 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No items yet</p>
                </div>
              ) : (
                <div className="px-4 pt-2 pb-1 flex flex-col gap-4">
                  {Array.from(new Set(items.map((i) => i.store))).map((store) => (
                    <div key={store}>
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{store}</span>
                      </div>
                      <ul>
                        {items.filter((i) => i.store === store).map((item) => {
                          const done = checkedItems.has(item.id)
                          return (
                            <li key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
                              <button
                                onClick={() => toggle(item.id)}
                                className={cn(
                                  "size-5 rounded shrink-0 border-2 flex items-center justify-center transition-all duration-150",
                                  done ? "bg-primary border-primary" : "border-border hover:border-primary/60"
                                )}
                                aria-label={done ? "Uncheck item" : "Check item"}
                              >
                                {done && (
                                  <motion.svg
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="size-3 text-primary-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </motion.svg>
                                )}
                              </button>
                              <span className="text-base leading-none shrink-0">{item.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium truncate", done && "line-through text-muted-foreground")}>
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                              </div>
                              {deleteItemId === item.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-xs text-muted-foreground">Delete?</span>
                                  <button
                                    onClick={() => { handleDeleteItem(item.id); setDeleteItemId(null) }}
                                    className="px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  >Yes</button>
                                  <button
                                    onClick={() => setDeleteItemId(null)}
                                    className="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                  >No</button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 shrink-0">
                                  {item.estimatedPrice > 0 && (
                                    <p className={cn("text-sm font-medium mr-1", done && "text-muted-foreground line-through")}>
                                      {formatCurrency(item.estimatedPrice, currency)}
                                    </p>
                                  )}
                                  <button
                                    onClick={() => openEdit(item)}
                                    className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    aria-label={`Edit ${item.name}`}
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                  {canDeleteItem(item) && (
                                    <button
                                      onClick={() => setDeleteItemId(item.id)}
                                      className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      aria-label={`Delete ${item.name}`}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item form */}
              <div className="px-4 pb-4">
                <AnimatePresence>
                  {showItemForm && (
                    <motion.form
                      key="item-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      onSubmit={handleSaveItem}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 pt-3 border-t border-border/60 mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {editingItemId ? "Edit item" : "Add item"}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label htmlFor={`item-name-${list.id}`} className="text-xs text-muted-foreground font-medium">Item name</label>
                            <input
                              id={`item-name-${list.id}`}
                              type="text"
                              placeholder="e.g. Milk"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor={`item-store-${list.id}`} className="text-xs text-muted-foreground font-medium">Store</label>
                            <input
                              id={`item-store-${list.id}`}
                              type="text"
                              placeholder="e.g. Woolworths"
                              value={store}
                              onChange={(e) => setStore(e.target.value)}
                              required
                              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor={`item-category-${list.id}`} className="text-xs text-muted-foreground font-medium">Category</label>
                          <select
                            id={`item-category-${list.id}`}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1">
                            <label htmlFor={`item-qty-${list.id}`} className="text-xs text-muted-foreground font-medium">Qty</label>
                            <input
                              id={`item-qty-${list.id}`}
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
                            <label htmlFor={`item-unit-${list.id}`} className="text-xs text-muted-foreground font-medium">Unit</label>
                            <input
                              id={`item-unit-${list.id}`}
                              type="text"
                              placeholder="pcs"
                              value={unit}
                              onChange={(e) => setUnit(e.target.value)}
                              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor={`item-price-${list.id}`} className="text-xs text-muted-foreground font-medium">Est. price</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                              <input
                                id={`item-price-${list.id}`}
                                type="number"
                                inputMode="decimal"
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

                        <div className="flex items-center gap-2 justify-end">
                          <Button type="button" variant="ghost" size="sm" onClick={closeItemForm}>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={createMutation.isPending || updateMutation.isPending}
                          >
                            {editingItemId ? "Save changes" : "Add item"}
                          </Button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {!showItemForm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={openCreate}
                  >
                    <Plus className="size-3.5" />
                    Add item
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
