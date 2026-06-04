# Meals — Weekly Plan & Recipes

## Types

**`DayMeals` type:**
```ts
type DayMeals = {
  day: string       // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  breakfast: string // recipe id, or "" if unset
  lunch: string
  dinner: string
  groupId: string
  eventId?: string
}
```

**`Recipe` type:**
```ts
type Recipe = {
  id: string
  name: string
  mealType: "breakfast" | "lunch" | "dinner"
  prepTime: number   // minutes
  calories: number
  servings: number
  tags: string[]
  icon: string
}
```

## Rules

- `breakfast`, `lunch`, `dinner` always present but can be `""` (empty slot)
- Adding a meal is an **upsert**: find the existing `DayMeals` for that day (matching `groupId`/`eventId`) and update the slot; if none exists, create a new one with all other slots empty
- Stats: `mealsPlanned` = count of non-empty slots across the filtered plan

## Meal add/edit form fields

| Field | Type | Notes |
|-------|------|-------|
| Day | select | Mon–Sun |
| Meal | select | Breakfast \| Lunch \| Dinner |
| Recipe | select | From `recipeList` state (show icon + name) |
| Event | select | Optional — only shown when group has events |

## Recipe add/edit form fields

| Field | Type | Notes |
|-------|------|-------|
| Name | string | Free text, required |
| Icon | string | Emoji, auto-defaulted by meal type on create |
| Meal type | select | breakfast \| lunch \| dinner |
| Prep time | number | Minutes, required |
| Calories | number | Required |
| Servings | number | Required |
| Tags | string | Comma-separated, optional |

## Display rules — meal plan

- `WeeklyPlanGrid` accepts optional `onEdit?: (day, mealKey, recipeId) => void` and `onDelete?: (day, mealKey) => void` — when omitted renders read-only
- `deleteSlot: { day: string; mealKey: MealKey } | null` lives in `WeeklyPlanGrid`
- `editingSlot: { day: string; mealKey: MealKey } | null` lives in `MealsSection`
- Edit/delete buttons appear on hover (`opacity-0 group-hover:opacity-100`) inside each filled slot pill
- Delete confirmation replaces slot content inline ("Delete? Yes No") — compact to fit grid cells
- Deleting a slot sets it to `""` and removes the `DayMeals` entry entirely if all 3 slots become empty
- Edit pre-fills the form and scrolls to it; save is the same upsert as create

## Display rules — recipes

- `RecipeList` accepts `data?: Recipe[]`, `onSave?: (recipe: Recipe) => void`, `onDelete?: (id: string) => void`
- When `onSave`/`onDelete` provided: "Add recipe" button + Pencil/Trash2 per row appear; otherwise read-only
- `deleteId: string | null`, all form state, and `editingId` live in `RecipeList`
- `RecipeList` calls `onSave(recipe)` for both create and edit (upsert by id)
- Empty meal type sections show "No recipes yet" placeholder

**Sort options (RecipeList):** Name / Prep / Calories — applied within each meal-type section

## State ownership

- `MealsSection` owns `useState<DayMeals[]>` + `useState<Recipe[]>` (initialized from `recipes` import)
- `recipeList` passed to both `RecipeList` (as `data`) and used in the meal form recipe dropdown
- `handleRecipeDelete` in `MealsSection` also clears deleted recipe from `planData` slots
- Stats (`recipeCount`, `avgPrep`, `avgCal`) derived from `recipeList` state

## Edit/delete pattern — meal plan

- `editingSlot` in `MealsSection` — `null` = create, set = edit (form pre-filled with that slot's day/mealKey/recipeId)
- `deleteSlot` in `WeeklyPlanGrid` — inline "Delete? Yes / No" replaces slot content; confirmed calls `onDelete(day, mealKey)` up to `MealsSection`
- `handleDelete` clears the slot and drops the `DayMeals` row if all slots become empty
- `handleSave` is a single upsert for both create and edit
