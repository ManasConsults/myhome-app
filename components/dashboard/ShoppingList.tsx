"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShoppingCart, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type ShoppingItem } from "@/lib/types"
import { useGroup } from "@/components/providers/GroupProvider"
import { useQuery } from "@tanstack/react-query"
import { getShoppingItems } from "@/lib/actions/shopping"

type SortKey = "updatedAt" | "createdAt" | "price" | "name"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updatedAt", label: "Updated" },
  { key: "createdAt", label: "Created" },
  { key: "price",     label: "Price" },
  { key: "name",      label: "Name" },
]

interface ShoppingListProps {
  data?: ShoppingItem[]
  onEdit?: (item: ShoppingItem) => void
  onDelete?: (id: string) => void
}

export function ShoppingList({ data, onEdit, onDelete }: ShoppingListProps) {
  const { activeGroup } = useGroup()
  const { data: fetchedItems = [] } = useQuery<ShoppingItem[]>({
    queryKey: ["shopping", activeGroup.id, null],
    queryFn: () => getShoppingItems(activeGroup.id),
    enabled: !data,
  })
  const source = data ?? fetchedItems
  const [sortBy, setSortBy] = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(source.filter((i) => i.checked).map((i) => i.id))
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Sort then group by store
  const sorted = [...source].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "updatedAt") return a.updatedAt < b.updatedAt ? -dir : dir
    if (sortBy === "createdAt") return a.createdAt < b.createdAt ? -dir : dir
    if (sortBy === "price") return dir * (a.estimatedPrice - b.estimatedPrice)
    if (sortBy === "name") return dir * a.name.localeCompare(b.name)
    return 0
  })
  const stores = Array.from(new Set(sorted.map((i) => i.store)))
  const grouped = stores.map((store) => ({
    store,
    items: sorted.filter((i) => i.store === store),
  }))

  const totalEstimate = source.reduce((sum, i) => sum + i.estimatedPrice, 0)
  const remaining = source
    .filter((i) => !checked.has(i.id))
    .reduce((sum, i) => sum + i.estimatedPrice, 0)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Shopping List</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {checked.size} of {source.length} items collected
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">${remaining.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">of ${totalEstimate.toFixed(2)} est.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
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
                    setSortDir("desc")
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
      <CardContent className="px-5 pb-5 flex flex-col gap-5">
        {grouped.map(({ store, items }, gi) => (
          <motion.div
            key={store}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: gi * 0.08 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {store}
              </span>
            </div>
            <ul className="space-y-0">
              {items.map((item, i) => {
                const done = checked.has(item.id)
                const isDeleting = deleteId === item.id
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: gi * 0.08 + i * 0.04 }}
                    className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
                  >
                    <button
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "size-5 rounded shrink-0 border-2 flex items-center justify-center transition-all duration-150",
                        done
                          ? "bg-primary border-primary"
                          : "border-border hover:border-primary/60"
                      )}
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
                      <p className={cn(
                        "text-sm font-medium",
                        done && "line-through text-muted-foreground"
                      )}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                      </p>
                    </div>

                    {isDeleting ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">Delete?</span>
                        <button
                          onClick={() => { onDelete?.(item.id); setDeleteId(null) }}
                          className="px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="text-right mr-1">
                          <p className={cn(
                            "text-sm font-medium",
                            done && "text-muted-foreground line-through"
                          )}>
                            ${item.estimatedPrice.toFixed(2)}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs border-0 bg-muted text-muted-foreground font-normal h-4 px-1.5 mt-0.5"
                          >
                            {item.category}
                          </Badge>
                        </div>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Edit item"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Delete item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
