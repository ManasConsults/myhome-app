"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Pencil, Trash2, ChefHat, Clock, Flame, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { type Recipe } from "@/lib/types"
import { cn } from "@/lib/utils"

type SortKey = "name" | "prepTime" | "calories"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name",     label: "Name" },
  { key: "prepTime", label: "Prep" },
  { key: "calories", label: "Calories" },
]

const MEAL_TYPES: Recipe["mealType"][] = ["breakfast", "lunch", "dinner"]
const MEAL_LABELS: Record<Recipe["mealType"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
}
const DEFAULT_ICONS: Record<Recipe["mealType"], string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
}

interface RecipeListProps {
  data?: Recipe[]
  onSave?: (recipe: Recipe) => void
  onDelete?: (id: string) => void
  suggestedTags?: string[]
}

export function RecipeList({ data, onSave, onDelete, suggestedTags = [] }: RecipeListProps) {
  const formCardRef = useRef<HTMLDivElement>(null)
  const source = data ?? []

  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [mealType, setMealType] = useState<Recipe["mealType"]>("breakfast")
  const [prepTime, setPrepTime] = useState("")
  const [calories, setCalories] = useState("")
  const [servings, setServings] = useState("1")
  const [tagsInput, setTagsInput] = useState("")
  const [icon, setIcon] = useState(DEFAULT_ICONS["breakfast"])

  function sortRecipes(rs: Recipe[]) {
    return [...rs].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortBy === "name")     return dir * a.name.localeCompare(b.name)
      if (sortBy === "prepTime") return dir * (a.prepTime - b.prepTime)
      if (sortBy === "calories") return dir * (a.calories - b.calories)
      return 0
    })
  }

  const grouped = MEAL_TYPES.reduce<Record<Recipe["mealType"], Recipe[]>>(
    (acc, type) => {
      acc[type] = sortRecipes(source.filter((r) => r.mealType === type))
      return acc
    },
    { breakfast: [], lunch: [], dinner: [] }
  )

  function resetForm() {
    setName("")
    setMealType("breakfast")
    setPrepTime("")
    setCalories("")
    setServings("1")
    setTagsInput("")
    setIcon(DEFAULT_ICONS["breakfast"])
  }

  function openCreate() {
    setEditingId(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(recipe: Recipe) {
    setEditingId(recipe.id)
    setName(recipe.name)
    setMealType(recipe.mealType)
    setPrepTime(String(recipe.prepTime))
    setCalories(String(recipe.calories))
    setServings(String(recipe.servings))
    setTagsInput(recipe.tags.join(", "))
    setIcon(recipe.icon)
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
    if (!name.trim()) return
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
    const today = new Date().toISOString().slice(0, 10)
    const existing = editingId ? source.find((r) => r.id === editingId) : null
    const recipe: Recipe = {
      id: editingId ?? `recipe-${Date.now()}`,
      name: name.trim(),
      mealType,
      prepTime: parseInt(prepTime) || 0,
      calories: parseInt(calories) || 0,
      servings: parseInt(servings) || 1,
      tags,
      icon: icon.trim() || DEFAULT_ICONS[mealType],
      createdAt: existing?.createdAt ?? today,
      updatedAt: today,
    }
    onSave?.(recipe)
    closeForm()
  }

  return (
    <Card ref={formCardRef} className="border-border/60">
      <CardHeader className="border-b border-border/60 pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ChefHat className="size-4 text-primary" />
            Saved Recipes
          </CardTitle>
          {onSave && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => (showForm ? closeForm() : openCreate())}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "Add recipe"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
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
      </CardHeader>

      <AnimatePresence>
        {showForm && (
          <motion.form
            key="recipe-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSave}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-3 border-b border-border/60">
              <p className="text-sm font-medium">{editingId ? "Edit recipe" : "New recipe"}</p>

              {/* Name + Icon */}
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Grilled Salmon"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Icon</label>
                  <input
                    type="text"
                    placeholder="🍳"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="h-9 w-16 px-3 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Meal type */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Meal type</label>
                <select
                  value={mealType}
                  onChange={(e) => {
                    const t = e.target.value as Recipe["mealType"]
                    setMealType(t)
                    if (!editingId) setIcon(DEFAULT_ICONS[t])
                  }}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {MEAL_TYPES.map((t) => <option key={t} value={t}>{MEAL_LABELS[t]}</option>)}
                </select>
              </div>

              {/* Prep time + Calories + Servings */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Prep (min)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="20"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Calories</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="400"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Servings</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="2"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    required
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. quick, healthy, meal-prep"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {suggestedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {suggestedTags.map((tag) => {
                      const active = tagsInput.split(",").map((t) => t.trim()).includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const current = tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
                            const next = active
                              ? current.filter((t) => t !== tag)
                              : [...current, tag]
                            setTagsInput(next.join(", "))
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs border transition-colors",
                            active
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
                <Button type="submit" size="sm">
                  {editingId ? "Save changes" : "Add recipe"}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <CardContent className="px-5 pb-5 pt-4">
        <div className="flex flex-col gap-4">
          {MEAL_TYPES.map((type, typeIdx) => (
            <div key={type}>
              {typeIdx > 0 && <Separator className="mb-4" />}
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                {MEAL_LABELS[type]}
              </p>
              {grouped[type].length === 0 ? (
                <p className="text-xs text-muted-foreground/50 italic">No recipes yet</p>
              ) : (
                <div className="flex flex-col gap-0">
                  {grouped[type].map((recipe, idx) => {
                    const isDeleting = deleteId === recipe.id
                    return (
                      <div key={recipe.id}>
                        {idx > 0 && <Separator className="my-2" />}
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                            {recipe.icon}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <p className="text-sm font-medium leading-tight">{recipe.name}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              {recipe.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0 h-4 font-normal">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {isDeleting ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-muted-foreground">Delete?</span>
                              <button
                                onClick={() => { onDelete?.(recipe.id); setDeleteId(null) }}
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
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                <span>{recipe.prepTime}m</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Flame className="size-3" />
                                <span>{recipe.calories}</span>
                              </div>
                              {(onSave || onDelete) && (
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  {onSave && (
                                    <button
                                      onClick={() => openEdit(recipe)}
                                      className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      aria-label="Edit recipe"
                                    >
                                      <Pencil className="size-3" />
                                    </button>
                                  )}
                                  {onDelete && (
                                    <button
                                      onClick={() => setDeleteId(recipe.id)}
                                      className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      aria-label="Delete recipe"
                                    >
                                      <Trash2 className="size-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
