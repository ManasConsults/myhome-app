"use client"

import { useState } from "react"
import { Pencil, Trash2, UtensilsCrossed } from "lucide-react"
import { type DayMeals, type Recipe } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const MEAL_LABELS = ["Breakfast", "Lunch", "Dinner"] as const
type MealKey = "breakfast" | "lunch" | "dinner"
const MEAL_KEYS: MealKey[] = ["breakfast", "lunch", "dinner"]

const TODAY_DAY = new Date().toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3)

interface WeeklyPlanGridProps {
  data: DayMeals[]
  recipes: Recipe[]
  onEdit?: (day: string, mealKey: MealKey, recipeId: string) => void
  onDelete?: (day: string, mealKey: MealKey) => void
}

export function WeeklyPlanGrid({ data, recipes, onEdit, onDelete }: WeeklyPlanGridProps) {
  const [deleteSlot, setDeleteSlot] = useState<{ day: string; mealKey: MealKey } | null>(null)

  function getRecipe(id: string) {
    return recipes.find((r) => r.id === id) ?? null
  }

  function renderSlot(dayPlan: DayMeals, key: MealKey) {
    const recipeId = dayPlan[key]
    const recipe = recipeId ? getRecipe(recipeId) : null
    const isDeleting = deleteSlot?.day === dayPlan.day && deleteSlot?.mealKey === key

    if (!recipe) {
      return (
        <div className="rounded-md px-2 py-1 text-xs text-muted-foreground/40 border border-dashed border-border/40 min-h-7 flex items-center">
          —
        </div>
      )
    }

    if (isDeleting) {
      return (
        <div className="rounded-md px-2 py-1 text-xs flex items-center justify-between gap-1 min-h-7 bg-destructive/10 border border-destructive/20">
          <span className="text-destructive text-xs shrink-0">Delete?</span>
          <div className="flex gap-0.5 shrink-0">
            <button
              onClick={() => { onDelete?.(dayPlan.day, key); setDeleteSlot(null) }}
              className="px-1.5 py-0.5 rounded text-xs font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setDeleteSlot(null)}
              className="px-1.5 py-0.5 rounded text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              No
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="group relative bg-muted rounded-md px-2 py-1 text-xs flex items-center gap-1 min-h-7">
        <span className="shrink-0">{recipe.icon}</span>
        <span className="truncate leading-tight flex-1">{recipe.name}</span>
        {(onEdit || onDelete) && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(dayPlan.day, key, recipe.id)}
                className="size-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Edit meal"
              >
                <Pencil className="size-2.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setDeleteSlot({ day: dayPlan.day, mealKey: key })}
                className="size-4 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete meal"
              >
                <Trash2 className="size-2.5" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <UtensilsCrossed className="size-4 text-primary" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {/* Desktop: 7-col grid */}
        <div className="hidden md:grid grid-cols-7 gap-2">
          {data.map((dayPlan) => {
            const isToday = dayPlan.day === TODAY_DAY
            return (
              <div key={dayPlan.day} className="flex flex-col gap-1.5">
                <p className={cn(
                  "text-xs text-center pb-1 border-b border-border/40",
                  isToday ? "font-bold text-primary" : "font-medium text-muted-foreground"
                )}>
                  {dayPlan.day}
                </p>
                {MEAL_KEYS.map((key) => (
                  <div key={key}>{renderSlot(dayPlan, key)}</div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical list */}
        <div className="flex flex-col gap-3 md:hidden">
          {data.map((dayPlan) => {
            const isToday = dayPlan.day === TODAY_DAY
            return (
              <div key={dayPlan.day} className="border border-border/40 rounded-lg p-3 flex flex-col gap-2">
                <p className={cn(
                  "text-sm",
                  isToday ? "font-bold text-primary" : "font-semibold"
                )}>
                  {dayPlan.day}
                  {isToday && <span className="ml-1.5 text-xs font-normal text-muted-foreground">Today</span>}
                </p>
                <div className="flex flex-col gap-1.5">
                  {MEAL_KEYS.map((key, idx) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16 shrink-0">{MEAL_LABELS[idx]}</span>
                      <div className="flex-1">{renderSlot(dayPlan, key)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
