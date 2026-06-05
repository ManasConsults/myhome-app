"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Receipt, Banknote, CheckSquare, ShoppingCart,
  StickyNote, CalendarDays, UtensilsCrossed,
  Plus, X, Pencil, Trash2, ArrowUp, ArrowDown,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Category, CategoryDomain } from "@/lib/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategory,
} from "@/lib/actions/categories"

const DOMAINS: { key: CategoryDomain; label: string; icon: LucideIcon; hasIcon: boolean; hasColor: boolean }[] = [
  { key: "expense",  label: "Expense",     icon: Receipt,         hasIcon: true,  hasColor: false },
  { key: "income",   label: "Income",      icon: Banknote,        hasIcon: true,  hasColor: false },
  { key: "task",     label: "Tasks",       icon: CheckSquare,     hasIcon: true,  hasColor: false },
  { key: "shopping", label: "Shopping",    icon: ShoppingCart,    hasIcon: true,  hasColor: false },
  { key: "note",     label: "Notes",       icon: StickyNote,      hasIcon: false, hasColor: false },
  { key: "calendar", label: "Calendar",    icon: CalendarDays,    hasIcon: true,  hasColor: true  },
  { key: "meal_tag", label: "Recipe Tags", icon: UtensilsCrossed, hasIcon: false, hasColor: false },
]

const COLOR_OPTIONS = [
  { value: "primary",     label: "Primary",     cls: "bg-primary" },
  { value: "success",     label: "Success",     cls: "bg-success" },
  { value: "warning",     label: "Warning",     cls: "bg-warning" },
  { value: "destructive", label: "Destructive", cls: "bg-destructive" },
  { value: "muted",       label: "Muted",       cls: "bg-muted-foreground" },
] as const

type FormState = { name: string; icon: string; color: string }
const EMPTY_FORM: FormState = { name: "", icon: "", color: "primary" }

type DeleteState =
  | { id: string; state: "confirming" }
  | { id: string; state: "blocked"; count: number }
  | null

type ReferenceDataManagerProps = {
  initialData: Record<CategoryDomain, Category[]>
}

export function ReferenceDataManager({ initialData }: ReferenceDataManagerProps) {
  const [activeDomain, setActiveDomain] = useState<CategoryDomain>("expense")

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveDomain(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
              activeDomain === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Active domain panel */}
      {DOMAINS.map(({ key, label, icon: Icon, hasIcon, hasColor }) =>
        activeDomain === key ? (
          <CategoryTab
            key={key}
            domain={key}
            label={label}
            Icon={Icon}
            hasIcon={hasIcon}
            hasColor={hasColor}
            initialItems={initialData[key] ?? []}
          />
        ) : null
      )}
    </div>
  )
}

// ── Per-domain tab ───────────────────────────────────────────────────────────

type TabProps = {
  domain: CategoryDomain
  label: string
  Icon: LucideIcon
  hasIcon: boolean
  hasColor: boolean
  initialItems: Category[]
}

function CategoryTab({ domain, label, Icon, hasIcon, hasColor, initialItems }: TabProps) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories", domain] })

  const { data: items = initialItems } = useQuery({
    queryKey: ["categories", domain],
    queryFn: () => getCategories(domain),
    initialData: initialItems,
  })

  const createMut = useMutation({
    mutationFn: (data: FormState) => createCategory(domain, data),
    onSuccess: invalidate,
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormState }) => updateCategory(id, data),
    onSuccess: invalidate,
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: invalidate,
  })
  const reorderMut = useMutation({
    mutationFn: ({ id, dir }: { id: string; dir: "up" | "down" }) => reorderCategory(id, dir),
    onSuccess: invalidate,
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id)
    setForm({ name: cat.name, icon: cat.icon, color: cat.color || "primary" })
    setShowForm(true)
    setDeleteState(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (editingId) {
      await updateMut.mutateAsync({ id: editingId, data: form })
    } else {
      await createMut.mutateAsync(form)
    }
    closeForm()
  }

  function handleDeleteClick(cat: Category) {
    if (deleteState?.id === cat.id) {
      setDeleteState(null)
      return
    }
    setDeleteState({ id: cat.id, state: "confirming" })
  }

  async function confirmDelete(id: string) {
    const result = await deleteMut.mutateAsync(id)
    if (result.success) {
      setDeleteState(null)
    } else if (result.usageCount !== undefined && result.usageCount > 0) {
      setDeleteState({ id, state: "blocked", count: result.usageCount })
    } else {
      setDeleteState(null)
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            {label} Categories
          </CardTitle>
          {!showForm && (
            <Button size="sm" variant="outline" onClick={openCreate} className="gap-1.5 h-8 text-xs">
              <Plus className="size-3.5" data-icon />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 flex flex-col gap-3">
        {/* Add / edit form */}
        <AnimatePresence initial={false}>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  {/* Name */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label htmlFor="cat-name" className="text-xs font-medium text-muted-foreground">
                      Name
                    </label>
                    <input
                      id="cat-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Category name"
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Icon (emoji) */}
                  {hasIcon && (
                    <div className="flex flex-col gap-1 w-24">
                      <label htmlFor="cat-icon" className="text-xs font-medium text-muted-foreground">
                        Icon
                      </label>
                      <input
                        id="cat-icon"
                        type="text"
                        value={form.icon}
                        onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                        placeholder="🏠"
                        className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                        maxLength={4}
                      />
                    </div>
                  )}

                  {/* Color (calendar only) */}
                  {hasColor && (
                    <div className="flex flex-col gap-1 w-36">
                      <label htmlFor="cat-color" className="text-xs font-medium text-muted-foreground">
                        Dot color
                      </label>
                      <select
                        id="cat-color"
                        value={form.color}
                        onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                        className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {COLOR_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!form.name.trim() || isSaving}
                    className="h-8 text-xs"
                  >
                    {isSaving ? "Saving…" : editingId ? "Save changes" : "Add category"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={closeForm} className="h-8 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category list */}
        <AnimatePresence initial={false}>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No categories yet. Add one above.
            </p>
          )}
          {items.map((cat, idx) => {
            const ds = deleteState?.id === cat.id ? deleteState : null
            const isEditing = editingId === cat.id && showForm

            return (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors",
                  isEditing
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 bg-card hover:bg-muted/30"
                )}
              >
                {/* Icon preview */}
                {hasIcon && (
                  <span className="text-base w-6 text-center shrink-0">{cat.icon || "—"}</span>
                )}

                {/* Calendar color dot */}
                {hasColor && cat.color && (
                  <span
                    className={cn(
                      "size-2.5 rounded-full shrink-0",
                      COLOR_OPTIONS.find((o) => o.value === cat.color)?.cls ?? "bg-muted-foreground"
                    )}
                  />
                )}

                {/* Name */}
                <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>

                {/* Delete feedback */}
                {ds?.state === "blocked" && (
                  <span className="text-xs text-destructive shrink-0">
                    Used by {ds.count} item{ds.count !== 1 ? "s" : ""} — remove them first
                  </span>
                )}
                {ds?.state === "confirming" && (
                  <span className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                    Delete?
                    <button
                      onClick={() => confirmDelete(cat.id)}
                      className="ml-1 px-2 py-0.5 rounded bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteState(null)}
                      className="px-2 py-0.5 rounded border border-border hover:bg-muted font-medium"
                    >
                      No
                    </button>
                  </span>
                )}

                {/* Actions */}
                {!ds && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => reorderMut.mutate({ id: cat.id, dir: "up" })}
                      disabled={idx === 0}
                      aria-label="Move up"
                      className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      onClick={() => reorderMut.mutate({ id: cat.id, dir: "down" })}
                      disabled={idx === items.length - 1}
                      aria-label="Move down"
                      className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(cat)}
                      aria-label="Edit category"
                      className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cat)}
                      aria-label="Delete category"
                      className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
