"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, UtensilsCrossed, BookOpen, Clock, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { weeklyMealPlan, recipes, type DayMeals, type Recipe } from "@/lib/dummy-data"
import { useGroup } from "@/components/providers/GroupProvider"
import { WeeklyPlanGrid } from "@/components/meals/WeeklyPlanGrid"
import { RecipeList } from "@/components/meals/RecipeList"
import { EventFilter } from "@/components/ui/EventFilter"

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

  const formCardRef = useRef<HTMLDivElement>(null)
  const [planData, setPlanData] = useState<DayMeals[]>([])
  const [recipeList, setRecipeList] = useState<Recipe[]>(recipes)
  const [showForm, setShowForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState<{ day: string; mealKey: MealKey } | null>(null)

  // Form fields
  const [day, setDay] = useState("Mon")
  const [mealKey, setMealKey] = useState<MealKey>("breakfast")
  const [recipeId, setRecipeId] = useState(recipeList[0]?.id ?? "")
  const [eventId, setEventId] = useState("")

  // Reset plan when scope changes
  useEffect(() => {
    const next = activeEvent
      ? weeklyMealPlan.filter((d) => d.eventId === activeEvent.id)
      : weeklyMealPlan.filter((d) => d.groupId === activeGroup.id)
    setPlanData(next)
  }, [activeGroup.id, activeEvent?.id])

  // Sync eventId with activeEvent
  useEffect(() => { setEventId(activeEvent?.id ?? "") }, [activeEvent?.id])

  const groupEvents = events.filter((e) => e.groupId === activeGroup.id)

  const mealsPlanned = planData.reduce((count, d) =>
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

  function handleRecipeSave(recipe: Recipe) {
    setRecipeList((prev) => {
      const idx = prev.findIndex((r) => r.id === recipe.id)
      if (idx !== -1) {
        const updated = [...prev]
        updated[idx] = recipe
        return updated
      }
      return [...prev, recipe]
    })
  }

  function handleRecipeDelete(id: string) {
    setRecipeList((prev) => prev.filter((r) => r.id !== id))
    // Clear deleted recipe from any planned meal slots
    setPlanData((prev) =>
      prev.reduce<DayMeals[]>((acc, d) => {
        const updated = {
          ...d,
          breakfast: d.breakfast === id ? "" : d.breakfast,
          lunch: d.lunch === id ? "" : d.lunch,
          dinner: d.dinner === id ? "" : d.dinner,
        }
        if (!updated.breakfast && !updated.lunch && !updated.dinner) return acc
        return [...acc, updated]
      }, [])
    )
  }

  function openCreate() {
    setEditingSlot(null)
    resetForm()
    setShowForm(true)
  }

  function openEdit(day: string, mealKey: MealKey, recipeId: string) {
    setEditingSlot({ day, mealKey })
    setDay(day)
    setMealKey(mealKey)
    setRecipeId(recipeId)
    const existing = planData.find((d) => d.day === day)
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

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeId) return

    const today = new Date().toISOString().slice(0, 10)
    setPlanData((prev) => {
      const existingIdx = prev.findIndex((d) => d.day === day)
      if (existingIdx !== -1) {
        const updated = [...prev]
        updated[existingIdx] = { ...updated[existingIdx], [mealKey]: recipeId, updatedAt: today }
        return updated
      }
      const newEntry: DayMeals = {
        day,
        breakfast: "",
        lunch: "",
        dinner: "",
        groupId: activeGroup.id,
        createdAt: today,
        updatedAt: today,
        ...(eventId ? { eventId } : {}),
        [mealKey]: recipeId,
      }
      const insertIdx = prev.findIndex((d) => DAYS.indexOf(d.day) > DAYS.indexOf(day))
      if (insertIdx === -1) return [...prev, newEntry]
      return [...prev.slice(0, insertIdx), newEntry, ...prev.slice(insertIdx)]
    })

    closeForm()
  }

  function handleDelete(day: string, mealKey: MealKey) {
    setPlanData((prev) =>
      prev.reduce<DayMeals[]>((acc, d) => {
        if (d.day !== day) return [...acc, d]
        const updated = { ...d, [mealKey]: "" }
        // Drop the day entry if all slots are now empty
        if (!updated.breakfast && !updated.lunch && !updated.dinner) return acc
        return [...acc, updated]
      }, [])
    )
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

                {/* Day + Meal slot */}
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

                {/* Recipe */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Recipe</label>
                  <select
                    value={recipeId}
                    onChange={(e) => setRecipeId(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {recipeList.map((r) => (
                      <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Event (optional) */}
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
          <WeeklyPlanGrid data={planData} onEdit={openEdit} onDelete={handleDelete} />
        </div>
        <div>
          <RecipeList data={recipeList} onSave={handleRecipeSave} onDelete={handleRecipeDelete} />
        </div>
      </div>
    </>
  )
}
