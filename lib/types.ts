export type CategoryDomain =
  | "expense"
  | "income"
  | "task"
  | "shopping"
  | "note"
  | "calendar"
  | "meal_tag"

export type Category = {
  id: string
  domain: CategoryDomain
  name: string
  icon: string
  color: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type Group = {
  id: string
  name: string
  type: "household"
  icon: string
  color: "primary" | "success" | "destructive" | "warning"
  currency: string
  description?: string
  location?: string
  isDefault?: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export type AppEvent = {
  id: string
  groupId: string
  name: string
  description?: string
  icon: string
  color: "primary" | "success" | "destructive" | "warning"
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: string
  title: string
  category: string
  priority: "high" | "medium" | "low"
  done: boolean
  due: string
  icon: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type Budget = {
  id: string
  name: string
  type: "monthly" | "yearly"
  category: string
  icon: string
  color: string
  amount: number
  spent: number
  startDate: string
  period: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type Expense = {
  id: string
  title: string
  amount: number
  category: string
  icon: string
  date: string
  recurring: boolean
  frequency?: "weekly" | "fortnightly" | "monthly" | "yearly"
  nextDate?: string
  budgetId?: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type Income = {
  id: string
  title: string
  amount: number
  category: string
  icon: string
  date: string
  recurring: boolean
  frequency?: "weekly" | "fortnightly" | "monthly" | "yearly"
  nextDate?: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type Loan = {
  id: string
  direction: "lent" | "borrowed"
  contact: string
  principal: number
  interestRate: number
  startDate: string
  dueDate?: string
  notes?: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type LoanAdvance = {
  id: string
  loanId: string
  amount: number
  date: string
  note?: string
  createdAt: string
  updatedAt: string
}

export type LoanRepayment = {
  id: string
  loanId: string
  amount: number
  date: string
  note?: string
  createdAt: string
  updatedAt: string
}

export type ShoppingItem = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  estimatedPrice: number
  checked: boolean
  store: string
  icon: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  time?: string
  category: string
  allDay: boolean
  icon: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type Note = {
  id: string
  title: string
  content: string
  category: string
  pinned: boolean
  color: "default" | "blue" | "green" | "yellow" | "rose"
  createdAt: string
  updatedAt: string
  groupId: string
  eventId?: string
}

export type Recipe = {
  id: string
  name: string
  mealType: "breakfast" | "lunch" | "dinner"
  prepTime: number
  calories: number
  servings: number
  tags: string[]
  icon: string
  createdAt: string
  updatedAt: string
}

export type DayMeals = {
  day: string
  breakfast: string
  lunch: string
  dinner: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}
