"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, UtensilsCrossed, BookOpen, Clock, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type DayMeals, type Recipe } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"
import { WeeklyPlanGrid } from "@/components/meals/WeeklyPlanGrid"
import { RecipeList } from "@/components/meals/RecipeList"
import { EventFilter } from "@/components/ui/EventFilter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getRecipes, createRecipe, updateRecipe, deleteRecipe, getMealPlan, upsertDayMeals, deleteDayMeals } from "@/lib/actions/meals"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
type MealKey = "breakfast" | "lunch" | "dinner"
const MEAL_KEYS: MealKey[] = ["breakfast", "lunch", "dinner"]
const MEAL_LABELS: Record<MealKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
}

export function MealsSection() {
  const { activeGroup, activeEvent, setActiveEvent, clearActiveEvent, events } = useGroup()
  const queryClient = useQueryClient()

  const formCardRef = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState<{ day: string; mealKey: MealKey } | null>(null)

  const [day, setDay] = useState("Mon")
  const [mealKey, setMealKey] = useState<MealKey>("breakfast")
  const [recipeId, setRecipeId] = useState("")
  const [eventId, setEventId] = useState("")

  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const groupId = activeGroup.id
  const activeEventId = activeEvent?.id ?? null

  const { data: recipeList = [] } = useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: getRecipes,
  })

  const { data: planList = [] } = useQuery<DayMeals[]>({
    queryKey: ["mealPlan", groupId, activeEventId],
    queryFn: () => getMealPlan(groupId, activeEvent?.id),
  })

  const invalidatePlan = () => queryClient.invalidateQueries({ queryKey: ["mealPlan", groupId] })
  const invalidateRecipes = () => queryClient.invalidateQueries({ queryKey: ["recipes"] })

  const upsertMutation = useMutation({ mutationFn: upsertDayMeals, onSuccess: invalidatePlan })
  const deleteDayMutation = useMutation({
    mutationFn: ({ day, eventId }: { day: string; eventId?: string }) => deleteDayMeals(groupId, day, eventId),
    onSuccess: invalidatePlan,
  })
  const createRecipeMutation = useMutation({ mutationFn: createRecipe, onSuccess: invalidateRecipes })
  const updateRecipeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateRecipe>[1] }) => updateRecipe(id, data),
    onSuccess: invalidateRecipes,
  })
  const deleteRecipeMutation = useMutation({ mutationFn: deleteRecipe, onSuccess: invalidateRecipes })

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const mealsPlanned = planList.reduce((count, d) =>
    count + (d.breakfast ? 1 : 0) + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0), 0)

  const recipeCount = recipeList.length
  const avgPrep = recipeList.length > 0
    ? Math.round((recipeList.reduce((sum, r) => sum + r.prepTime, 0) / recipeList.length) / 5) * 5
    : 0
  const avgCal = recipeList.length > 0
    ? Math.round((recipeList.reduce((sum, r) => sum + r.calories, 0) / recipeList.length) / 10) * 10
    : 0

  const statsData = [
    { label: "Meals Planned", value: `${mealsPlanned} meals`, icon: UtensilsCrossed, color: "text-primary", bg: "bg-primary/10" },
    { label: "Recipes Saved", value: recipeCount, icon: BookOpen, color: "text-success", bg: "bg-success/10" },
    { label: "Avg Prep Time", value: `${avgPrep}m`, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Avg Calories", value: avgCal, icon: Flame, color: "text-destructive", bg: "bg-destructive/10" },
  ]

  function resetForm() {
    setDay("Mon")
    setMealKey("breakfast")
    setRecipeId(recipeList[0]?.id ?? "")
    setEventId(activeEvent?.id ?? "")
  }

  async function handleRecipeSave(recipe: Recipe) {
    const isNew = !recipeList.find((r) => r.id === recipe.id)
    const data = {
      name: recipe.name,
      mealType: recipe.mealType,
      prepTime: recipe.prepTime,
      calories: recipe.calories,
      servings: recipe.servings,
      tags: recipe.tags,
      icon: recipe.icon,
    }
    if (isNew) {
      await createRecipeMutation.mutateAsync(data)
    } else {
      await updateRecipeMutation.mutateAsync({ id: recipe.id, data })
    }
  }

  async function handleRecipeDelete(id: string) {
    await deleteRecipeMutation.mutateAsync(id)
    // Clear deleted recipe from plan slots
    const affected = planList.filter((d) => d.breakfast === id || d.lunch === id || d.dinner === id)
    await Promise.all(affected.map((d) => {
      const updated = {
        ...d,
        breakfast: d.breakfast === id ? "" : d.breakfast,
        lunch: d.lunch === id ? "" : d.lunch,
        dinner: d.dinner === id ? "" : d.dinner,
      }
      if (!updated.breakfast && !updated.lunch && !updated.dinner) {
        return deleteDayMutation.mutateAsync({ day: d.day, eventId: d.eventId })
      }
      return upsertMutation.mutateAsync(updated)
    }))
  }

  function openCreate() {
    setEditingSlot(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(slotDay: string, slotMealKey: MealKey, slotRecipeId: string) {
    setEditingSlot({ day: slotDay, mealKey: slotMealKey })
    setDay(slotDay)
    setMealKey(slotMealKey)
    setRecipeId(slotRecipeId)
    const existing = planList.find((d) => d.day === slotDay)
    setEventId(existing?.eventId ?? activeEvent?.id ?? "")
    setShowForm(true)
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function closeForm() {
    setShowForm(false)
    setEditingSlot(null)
    resetForm()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeId) return

    const existing = planList.find((d) => d.day === day)
    const payload: Omit<DayMeals, "createdAt" | "updatedAt"> = {
      day,
      breakfast: existing?.breakfast ?? "",
      lunch: existing?.lunch ?? "",
      dinner: existing?.dinner ?? "",
      groupId: activeGroup.id,
      ...(eventId ? { eventId } : {}),
      [mealKey]: recipeId,
    }

    const result = await upsertMutation.mutateAsync(payload)
    if (result.success) closeForm()
  }

  async function handleDelete(slotDay: string, slotMealKey: MealKey) {
    const existing = planList.find((d) => d.day === slotDay)
    if (!existing) return

    const updated = { ...existing, [slotMealKey]: "" }
    if (!updated.breakfast && !updated.lunch && !updated.dinner) {
      await deleteDayMutation.mutateAsync({ day: slotDay, eventId: existing.eventId })
    } else {
      await upsertMutation.mutateAsync(updated)
    }
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
            <CardTitle>Meal Plan</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => (showForm ? closeForm() : openCreate())}
            >
              {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {showForm ? "Cancel" : "Add meal"}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showForm && (
            <motion.form
              key="meal-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3 border-b border-border/60">
                <p className="text-sm font-medium">{editingSlot ? "Edit meal" : "New meal"}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Day</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Meal</label>
                    <select
                      value={mealKey}
                      onChange={(e) => setMealKey(e.target.value as MealKey)}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {MEAL_KEYS.map((k) => <option key={k} value={k}>{MEAL_LABELS[k]}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Recipe</label>
                  <select
                    value={recipeId}
                    onChange={(e) => setRecipeId(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select a recipe</option>
                    {recipeList.map((r) => (
                      <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                    ))}
                  </select>
                </div>

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
                  <Button type="submit" size="sm" disabled={upsertMutation.isPending}>
                    {editingSlot ? "Save changes" : "Add meal"}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <div className="lg:col-span-2">
          <WeeklyPlanGrid data={planList} onEdit={openEdit} onDelete={handleDelete} />
        </div>
        <div>
          <RecipeList data={recipeList} onSave={handleRecipeSave} onDelete={handleRecipeDelete} />
        </div>
      </div>
    </>
  )
}
