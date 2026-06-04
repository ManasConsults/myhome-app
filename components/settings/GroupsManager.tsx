"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Group } from "@/lib/types"
import { useAuth } from "@/components/providers/AuthProvider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getGroups, createGroup, updateGroup, deleteGroup } from "@/lib/actions/groups"

const COLOR_MAP = {
  primary:     { bg: "bg-primary/10",     text: "text-primary",     dot: "bg-primary" },
  success:     { bg: "bg-success/10",     text: "text-success",     dot: "bg-success" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  warning:     { bg: "bg-warning/10",     text: "text-warning",     dot: "bg-warning" },
} as const

type ColorKey = keyof typeof COLOR_MAP
type SortKey = "name" | "location"

const COLOR_OPTIONS: ColorKey[] = ["primary", "success", "destructive", "warning"]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name",     label: "Name" },
  { key: "location", label: "Location" },
]

const CURRENCIES = ["AUD", "USD", "EUR", "GBP", "CAD", "NZD", "SGD", "INR"]

type FormState = {
  name: string
  location: string
  icon: string
  color: ColorKey
  currency: string
}

const DEFAULT_FORM: FormState = { name: "", location: "", icon: "🏠", color: "primary", currency: "AUD" }

export function GroupsManager() {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLDivElement>(null)

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", userId],
    queryFn: () => getGroups(userId),
    enabled: !!userId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["groups", userId] })
  const createMutation = useMutation({ mutationFn: (data: Parameters<typeof createGroup>[1]) => createGroup(userId, data), onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateGroup>[1] }) => updateGroup(id, data), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: deleteGroup, onSuccess: invalidate })

  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  function openCreate() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setShowForm(true)
  }

  function openEdit(g: Group) {
    setEditingId(g.id)
    setForm({ name: g.name, location: g.location ?? "", icon: g.icon, color: g.color, currency: g.currency })
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    const payload = {
      name: form.name.trim(),
      type: "household" as const,
      icon: form.icon.trim() || "🏠",
      color: form.color,
      currency: form.currency,
      ...(form.location.trim() ? { location: form.location.trim() } : { location: undefined }),
    }

    if (editingId) {
      const result = await updateMutation.mutateAsync({ id: editingId, data: payload })
      if (result.success) closeForm()
    } else {
      const result = await createMutation.mutateAsync(payload)
      if (result.success) closeForm()
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage your household groups.</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => (showForm ? closeForm() : openCreate())}
        >
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? "Cancel" : "Add group"}
        </Button>
      </div>

      <div ref={formRef}>
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="group-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden mb-4"
            >
              <Card>
                <CardContent className="p-4">
                  <form onSubmit={handleSave} className="flex flex-col gap-3">
                    <p className="text-sm font-medium">{editingId ? "Edit Household" : "New Household"}</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. My Home"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          required
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Brisbane"
                          value={form.location}
                          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Icon</label>
                        <input
                          type="text"
                          placeholder="🏠"
                          value={form.icon}
                          onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Color</label>
                        <select
                          value={form.color}
                          onChange={(e) => setForm((f) => ({ ...f, color: e.target.value as ColorKey }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
                        >
                          {COLOR_OPTIONS.map((c) => (
                            <option key={c} value={c} className="capitalize">{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Currency</label>
                        <select
                          value={form.currency}
                          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
                      <Button type="submit" size="sm">
                        {editingId ? "Save changes" : "Add household"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5">
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
                  setSortDir("asc")
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

      <div className="flex flex-col gap-2">
        {[...groups].sort((a, b) => {
          const dir = sortDir === "asc" ? 1 : -1
          if (sortBy === "name") return dir * a.name.localeCompare(b.name)
          if (sortBy === "location") return dir * (a.location ?? "").localeCompare(b.location ?? "")
          return 0
        }).map((g) => {
          const c = COLOR_MAP[g.color]
          const isDeleting = deleteId === g.id
          return (
            <Card key={g.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center text-lg shrink-0", c.bg)}>
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{g.name}</p>
                      {g.isDefault && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {[g.location, g.currency].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className={cn("size-2.5 rounded-full shrink-0", c.dot)} />
                  {isDeleting ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">Delete?</span>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-2 py-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openEdit(g)}
                        className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label={`Edit ${g.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {!g.isDefault && (
                        <button
                          onClick={() => setDeleteId(g.id)}
                          className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={`Delete ${g.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
