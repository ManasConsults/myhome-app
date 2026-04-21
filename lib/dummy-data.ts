export const stats = {
  balance: 12480.5,
  income: 5200.0,
  expenses: 3140.75,
  savings: 2059.25,
  savingsGoal: 5000,
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

export const groups: Group[] = [
  { id: "g1", name: "My Home", type: "household", icon: "🏠", color: "primary", currency: "AUD", location: "Brisbane", isDefault: true, userId: "user-1", createdAt: "2024-01-01", updatedAt: "2026-01-15" },
  { id: "g2", name: "Mum's House", type: "household", icon: "🏡", color: "success", currency: "INR", location: "Hyderabad", userId: "user-1", createdAt: "2024-06-01", updatedAt: "2025-11-20" },
]

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

export const events: AppEvent[] = [
  { id: "ev1", groupId: "g1", name: "Wedding 2026", icon: "💍", color: "destructive", startDate: "2026-09-15", description: "Sarah & Tom's wedding", createdAt: "2026-01-10", updatedAt: "2026-03-05" },
  { id: "ev2", groupId: "g1", name: "Europe Trip", icon: "✈️", color: "warning", startDate: "2026-07-01", endDate: "2026-07-21", description: "Summer holiday", createdAt: "2026-02-20", updatedAt: "2026-04-01" },
]

export type Transaction = {
  id: string
  title: string
  category: string
  amount: number
  type: "income" | "expense"
  date: string
  icon: string
  groupId: string
  createdAt: string
  updatedAt: string
}

export const transactions: Transaction[] = [
  { id: "1", title: "Salary", category: "Income", amount: 5200, type: "income", date: "2026-03-20", icon: "💼", groupId: "g1", createdAt: "2026-03-20", updatedAt: "2026-03-20" },
  { id: "2", title: "Grocery Store", category: "Food", amount: -142.5, type: "expense", date: "2026-03-19", icon: "🛒", groupId: "g1", createdAt: "2026-03-19", updatedAt: "2026-03-19" },
  { id: "3", title: "Netflix", category: "Entertainment", amount: -15.99, type: "expense", date: "2026-03-18", icon: "🎬", groupId: "g1", createdAt: "2026-03-18", updatedAt: "2026-03-18" },
  { id: "4", title: "Electric Bill", category: "Utilities", amount: -98.0, type: "expense", date: "2026-03-17", icon: "⚡", groupId: "g1", createdAt: "2026-03-17", updatedAt: "2026-03-17" },
  { id: "5", title: "Freelance Work", category: "Income", amount: 800, type: "income", date: "2026-03-16", icon: "💻", groupId: "g1", createdAt: "2026-03-16", updatedAt: "2026-03-16" },
  { id: "6", title: "Restaurant", category: "Food", amount: -64.2, type: "expense", date: "2026-03-15", icon: "🍽️", groupId: "g1", createdAt: "2026-03-15", updatedAt: "2026-03-15" },
  { id: "7", title: "Gym Membership", category: "Health", amount: -45.0, type: "expense", date: "2026-03-14", icon: "🏋️", groupId: "g1", createdAt: "2026-03-14", updatedAt: "2026-03-14" },
  { id: "8", title: "Amazon", category: "Shopping", amount: -89.99, type: "expense", date: "2026-03-13", icon: "📦", groupId: "g1", createdAt: "2026-03-13", updatedAt: "2026-03-13" },
]

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

export const tasks: Task[] = [
  { id: "1", title: "Pay electricity bill", category: "Bills", priority: "high", done: false, due: "2026-03-24", icon: "⚡", groupId: "g1", createdAt: "2026-03-17", updatedAt: "2026-03-17" },
  { id: "2", title: "Clean the kitchen", category: "Chores", priority: "medium", done: true, due: "2026-03-22", icon: "🧹", groupId: "g1", createdAt: "2026-03-15", updatedAt: "2026-03-22" },
  { id: "3", title: "Schedule plumber visit", category: "Maintenance", priority: "high", done: false, due: "2026-03-23", icon: "🔧", groupId: "g1", createdAt: "2026-03-16", updatedAt: "2026-03-16" },
  { id: "4", title: "Buy groceries", category: "Shopping", priority: "medium", done: false, due: "2026-03-22", icon: "🛒", groupId: "g1", createdAt: "2026-03-15", updatedAt: "2026-03-15" },
  { id: "5", title: "Renew home insurance", category: "Bills", priority: "low", done: false, due: "2026-03-30", icon: "🏠", groupId: "g1", createdAt: "2026-03-23", updatedAt: "2026-03-23" },
  { id: "6", title: "Water the plants", category: "Chores", priority: "low", done: true, due: "2026-03-21", icon: "🌿", groupId: "g1", createdAt: "2026-03-14", updatedAt: "2026-03-21" },
  { id: "t-g2-1", title: "Fix back fence", category: "Maintenance", priority: "high", done: false, due: "2026-04-15", icon: "🔨", groupId: "g2", createdAt: "2026-04-08", updatedAt: "2026-04-08" },
  { id: "t-g2-2", title: "Replace smoke alarms", category: "Safety", priority: "high", done: false, due: "2026-04-10", icon: "🔔", groupId: "g2", createdAt: "2026-04-03", updatedAt: "2026-04-03" },
  { id: "t-g2-3", title: "Trim garden hedges", category: "Garden", priority: "low", done: true, due: "2026-04-05", icon: "🌿", groupId: "g2", createdAt: "2026-03-29", updatedAt: "2026-04-05" },
  { id: "t-ev1-1", title: "Book wedding venue", category: "Venue", priority: "high", done: true, due: "2026-02-01", icon: "🏛️", groupId: "g1", eventId: "ev1", createdAt: "2026-01-25", updatedAt: "2026-02-01" },
  { id: "t-ev1-2", title: "Send invitations", category: "Admin", priority: "high", done: false, due: "2026-04-30", icon: "✉️", groupId: "g1", eventId: "ev1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "t-ev1-3", title: "Order wedding cake", category: "Catering", priority: "medium", done: false, due: "2026-05-01", icon: "🎂", groupId: "g1", eventId: "ev1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "t-ev1-4", title: "Book photographer", category: "Vendors", priority: "high", done: true, due: "2026-03-01", icon: "📷", groupId: "g1", eventId: "ev1", createdAt: "2026-02-22", updatedAt: "2026-03-01" },
  { id: "t-ev2-1", title: "Book flights to London", category: "Travel", priority: "high", done: false, due: "2026-05-01", icon: "✈️", groupId: "g1", eventId: "ev2", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "t-ev2-2", title: "Book hotels in Paris", category: "Accommodation", priority: "high", done: false, due: "2026-05-15", icon: "🏨", groupId: "g1", eventId: "ev2", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
]

export const spendingByCategory = [
  { category: "Food", amount: 206.7, color: "var(--color-chart-2)" },
  { category: "Utilities", amount: 98.0, color: "var(--color-chart-3)" },
  { category: "Entertainment", amount: 15.99, color: "var(--color-chart-1)" },
  { category: "Health", amount: 45.0, color: "var(--color-chart-4)" },
  { category: "Shopping", amount: 89.99, color: "var(--color-chart-5)" },
]

export const monthlyTrend = [
  { month: "Oct", income: 5200, expenses: 2800 },
  { month: "Nov", income: 5200, expenses: 3100 },
  { month: "Dec", income: 6200, expenses: 4200 },
  { month: "Jan", income: 5200, expenses: 2950 },
  { month: "Feb", income: 5200, expenses: 2700 },
  { month: "Mar", income: 6000, expenses: 3140 },
]

export type BudgetCategory = {
  category: string
  budget: number
  spent: number
  color: string
  icon: string
}

export const budgets: BudgetCategory[] = [
  { category: "Food & Dining", budget: 600, spent: 206.7, color: "var(--color-chart-2)", icon: "🍽️" },
  { category: "Utilities", budget: 300, spent: 98.0, color: "var(--color-chart-3)", icon: "⚡" },
  { category: "Entertainment", budget: 100, spent: 15.99, color: "var(--color-chart-1)", icon: "🎬" },
  { category: "Health & Fitness", budget: 150, spent: 45.0, color: "var(--color-chart-4)", icon: "🏋️" },
  { category: "Shopping", budget: 200, spent: 89.99, color: "var(--color-chart-5)", icon: "🛍️" },
  { category: "Transportation", budget: 250, spent: 0, color: "var(--color-chart-1)", icon: "🚗" },
]

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

export const userBudgets: Budget[] = [
  { id: "1", name: "Groceries", type: "monthly", category: "Food & Dining", icon: "🛒", color: "var(--color-chart-2)", amount: 600, spent: 206.7, startDate: "2026-01-01", period: "April 2026", groupId: "g1", createdAt: "2024-03-01", updatedAt: "2026-04-01" },
  { id: "2", name: "Electricity & Gas", type: "monthly", category: "Utilities", icon: "⚡", color: "var(--color-chart-3)", amount: 300, spent: 280, startDate: "2026-01-01", period: "April 2026", groupId: "g1", createdAt: "2024-06-15", updatedAt: "2026-04-01" },
  { id: "3", name: "Netflix & Streaming", type: "monthly", category: "Entertainment", icon: "🎬", color: "var(--color-chart-1)", amount: 50, spent: 15.99, startDate: "2026-01-01", period: "April 2026", groupId: "g1", createdAt: "2025-01-03", updatedAt: "2026-04-01" },
  { id: "4", name: "Gym & Health", type: "monthly", category: "Health & Fitness", icon: "🏋️", color: "var(--color-chart-4)", amount: 150, spent: 145, startDate: "2026-01-01", period: "April 2026", groupId: "g1", createdAt: "2025-03-05", updatedAt: "2026-04-05" },
  { id: "5", name: "Clothing & Shopping", type: "monthly", category: "Shopping", icon: "🛍️", color: "var(--color-chart-5)", amount: 200, spent: 89.99, startDate: "2026-01-01", period: "April 2026", groupId: "g1", createdAt: "2025-08-10", updatedAt: "2026-03-15" },
  { id: "6", name: "Annual Holiday", type: "yearly", category: "Travel", icon: "✈️", color: "var(--color-chart-2)", amount: 5000, spent: 1240, startDate: "2026-01-01", period: "2026", groupId: "g1", createdAt: "2024-01-01", updatedAt: "2026-04-05" },
  { id: "7", name: "Home Maintenance", type: "yearly", category: "Housing", icon: "🏠", color: "var(--color-chart-3)", amount: 3000, spent: 3150, startDate: "2026-01-01", period: "2026", groupId: "g1", createdAt: "2023-06-01", updatedAt: "2026-03-28" },
  { id: "8", name: "Education & Courses", type: "yearly", category: "Education", icon: "📚", color: "var(--color-chart-4)", amount: 1200, spent: 299, startDate: "2026-01-01", period: "2026", groupId: "g1", createdAt: "2025-09-01", updatedAt: "2026-02-15" },
  { id: "b-g2-1", name: "Groceries", type: "monthly", category: "Food & Dining", icon: "🛒", color: "var(--color-chart-2)", amount: 400, spent: 180, startDate: "2026-01-01", period: "April 2026", groupId: "g2", createdAt: "2026-01-01", updatedAt: "2026-04-01" },
  { id: "b-g2-2", name: "Utilities", type: "monthly", category: "Utilities", icon: "⚡", color: "var(--color-chart-3)", amount: 250, spent: 210, startDate: "2026-01-01", period: "April 2026", groupId: "g2", createdAt: "2026-01-01", updatedAt: "2026-04-01" },
  { id: "b-ev1-1", name: "Venue", type: "yearly", category: "Housing", icon: "🏛️", color: "var(--color-chart-1)", amount: 8000, spent: 2000, startDate: "2026-01-01", period: "2026", groupId: "g1", eventId: "ev1", createdAt: "2026-01-01", updatedAt: "2026-03-15" },
  { id: "b-ev1-2", name: "Catering", type: "yearly", category: "Food & Dining", icon: "🍽️", color: "var(--color-chart-2)", amount: 5000, spent: 1500, startDate: "2026-01-01", period: "2026", groupId: "g1", eventId: "ev1", createdAt: "2026-01-01", updatedAt: "2026-03-20" },
  { id: "b-ev1-3", name: "Photography", type: "yearly", category: "Entertainment", icon: "📷", color: "var(--color-chart-4)", amount: 3000, spent: 500, startDate: "2026-01-01", period: "2026", groupId: "g1", eventId: "ev1", createdAt: "2026-01-01", updatedAt: "2026-04-01" },
]

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

export const expenses: Expense[] = [
  // Recurring — monthly (createdAt = when first set up; updatedAt = last time amount/details changed)
  { id: "e1", title: "Rent", amount: 2200, category: "Housing", icon: "🏠", date: "2026-04-01", recurring: true, frequency: "monthly", nextDate: "2026-05-01", budgetId: undefined, groupId: "g1", createdAt: "2025-01-01", updatedAt: "2026-03-01" },
  { id: "e2", title: "Netflix", amount: 15.99, category: "Entertainment", icon: "🎬", date: "2026-04-03", recurring: true, frequency: "monthly", nextDate: "2026-05-03", budgetId: "3", groupId: "g1", createdAt: "2024-06-03", updatedAt: "2026-01-03" },
  { id: "e3", title: "Gym Membership", amount: 45, category: "Health & Fitness", icon: "🏋️", date: "2026-04-05", recurring: true, frequency: "monthly", nextDate: "2026-05-05", budgetId: "4", groupId: "g1", createdAt: "2025-03-05", updatedAt: "2026-04-05" },
  { id: "e4", title: "Spotify", amount: 9.99, category: "Entertainment", icon: "🎵", date: "2026-04-08", recurring: true, frequency: "monthly", nextDate: "2026-05-08", budgetId: "3", groupId: "g1", createdAt: "2023-11-08", updatedAt: "2025-11-08" },
  { id: "e5", title: "Internet Bill", amount: 79, category: "Utilities", icon: "📡", date: "2026-04-10", recurring: true, frequency: "monthly", nextDate: "2026-05-10", budgetId: "2", groupId: "g1", createdAt: "2025-06-10", updatedAt: "2026-02-10" },
  // Recurring — weekly
  { id: "e6", title: "Groceries", amount: 120, category: "Food & Dining", icon: "🛒", date: "2026-04-07", recurring: true, frequency: "weekly", nextDate: "2026-04-14", budgetId: "1", groupId: "g1", createdAt: "2025-09-01", updatedAt: "2026-04-07" },
  // Recurring — fortnightly
  { id: "e7", title: "Cleaner", amount: 85, category: "Housing", icon: "🧹", date: "2026-04-04", recurring: true, frequency: "fortnightly", nextDate: "2026-04-18", groupId: "g1", createdAt: "2026-02-04", updatedAt: "2026-04-04" },
  // Recurring — yearly
  { id: "e8", title: "Home Insurance", amount: 1200, category: "Housing", icon: "🏡", date: "2026-01-15", recurring: true, frequency: "yearly", nextDate: "2027-01-15", groupId: "g1", createdAt: "2023-01-15", updatedAt: "2026-01-15" },
  { id: "e9", title: "Car Registration", amount: 380, category: "Transportation", icon: "🚗", date: "2026-03-01", recurring: true, frequency: "yearly", nextDate: "2027-03-01", groupId: "g1", createdAt: "2024-03-01", updatedAt: "2026-03-01" },
  // One-off (createdAt ≈ date; updatedAt shows if edited after the fact)
  { id: "e10", title: "Dentist Appointment", amount: 220, category: "Health & Fitness", icon: "🦷", date: "2026-04-02", recurring: false, groupId: "g1", createdAt: "2026-04-02", updatedAt: "2026-04-09" },
  { id: "e11", title: "New Running Shoes", amount: 149.99, category: "Shopping", icon: "👟", date: "2026-04-04", recurring: false, budgetId: "5", groupId: "g1", createdAt: "2026-04-04", updatedAt: "2026-04-04" },
  { id: "e12", title: "Restaurant — Date Night", amount: 98.5, category: "Food & Dining", icon: "🍽️", date: "2026-04-06", recurring: false, budgetId: "1", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-10" },
  { id: "e13", title: "Uber", amount: 24.8, category: "Transportation", icon: "🚕", date: "2026-04-06", recurring: false, groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { id: "e14", title: "Coffee Machine Repair", amount: 65, category: "Housing", icon: "☕", date: "2026-03-28", recurring: false, groupId: "g1", createdAt: "2026-03-28", updatedAt: "2026-04-01" },
  { id: "ex-g2-1", title: "Rent contribution", amount: 800, category: "Housing", icon: "🏡", date: "2026-04-01", recurring: true, frequency: "monthly", nextDate: "2026-05-01", groupId: "g2", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "ex-g2-2", title: "Water bill", amount: 65, category: "Utilities", icon: "💧", date: "2026-04-03", recurring: false, groupId: "g2", createdAt: "2026-04-03", updatedAt: "2026-04-03" },
  { id: "ex-ev1-1", title: "Venue deposit", amount: 2000, category: "Housing", icon: "🏛️", date: "2026-03-15", recurring: false, groupId: "g1", eventId: "ev1", createdAt: "2026-03-15", updatedAt: "2026-03-15" },
  { id: "ex-ev1-2", title: "Catering deposit", amount: 1500, category: "Food & Dining", icon: "🍽️", date: "2026-03-20", recurring: false, groupId: "g1", eventId: "ev1", createdAt: "2026-03-20", updatedAt: "2026-03-20" },
  { id: "ex-ev1-3", title: "Photographer deposit", amount: 500, category: "Entertainment", icon: "📷", date: "2026-04-01", recurring: false, groupId: "g1", eventId: "ev1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "ex-ev2-1", title: "Flight booking", amount: 1200, category: "Travel", icon: "✈️", date: "2026-04-05", recurring: false, groupId: "g1", eventId: "ev2", createdAt: "2026-04-05", updatedAt: "2026-04-05" },
  { id: "ex-ev2-2", title: "Travel insurance", amount: 180, category: "Travel", icon: "🛡️", date: "2026-04-06", recurring: false, groupId: "g1", eventId: "ev2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
]

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

export const incomes: Income[] = [
  // Recurring — monthly (createdAt = when first set up; updatedAt = last time amount/details changed)
  { id: "i1", title: "Salary", amount: 5200, category: "Salary", icon: "💼", date: "2026-04-20", recurring: true, frequency: "monthly", nextDate: "2026-05-20", groupId: "g1", createdAt: "2024-01-20", updatedAt: "2026-03-20" },
  { id: "i2", title: "Rental Income", amount: 1400, category: "Rental Income", icon: "🏠", date: "2026-04-01", recurring: true, frequency: "monthly", nextDate: "2026-05-01", groupId: "g1", createdAt: "2025-06-01", updatedAt: "2026-04-01" },
  { id: "i3", title: "Dividend Payment", amount: 180, category: "Investment", icon: "📈", date: "2026-04-15", recurring: true, frequency: "monthly", nextDate: "2026-05-15", groupId: "g1", createdAt: "2025-01-15", updatedAt: "2026-01-15" },
  // Recurring — fortnightly
  { id: "i4", title: "Part-time Tutoring", amount: 320, category: "Freelance", icon: "📖", date: "2026-04-11", recurring: true, frequency: "fortnightly", nextDate: "2026-04-25", groupId: "g1", createdAt: "2026-02-11", updatedAt: "2026-04-11" },
  // Recurring — yearly
  { id: "i5", title: "Tax Refund", amount: 2400, category: "Government Benefits", icon: "🏛️", date: "2026-07-01", recurring: true, frequency: "yearly", nextDate: "2027-07-01", groupId: "g1", createdAt: "2023-07-01", updatedAt: "2025-07-01" },
  { id: "i6", title: "Annual Bonus", amount: 3500, category: "Salary", icon: "🎁", date: "2026-12-15", recurring: true, frequency: "yearly", nextDate: "2027-12-15", groupId: "g1", createdAt: "2024-12-15", updatedAt: "2025-12-15" },
  // One-off (createdAt ≈ date; updatedAt shows if edited after the fact)
  { id: "i7", title: "Freelance Web Project", amount: 1800, category: "Freelance", icon: "💻", date: "2026-04-05", recurring: false, groupId: "g1", createdAt: "2026-04-05", updatedAt: "2026-04-10" },
  { id: "i8", title: "Sold Old Furniture", amount: 250, category: "Other", icon: "🪑", date: "2026-04-03", recurring: false, groupId: "g1", createdAt: "2026-04-03", updatedAt: "2026-04-03" },
  { id: "i9", title: "Birthday Gift", amount: 100, category: "Gift", icon: "🎂", date: "2026-03-30", recurring: false, groupId: "g1", createdAt: "2026-03-30", updatedAt: "2026-04-02" },
  { id: "i10", title: "Consulting — Strategy Session", amount: 600, category: "Business Income", icon: "🤝", date: "2026-03-25", recurring: false, groupId: "g1", createdAt: "2026-03-25", updatedAt: "2026-03-25" },
  { id: "in-g2-1", title: "Grocery contribution", amount: 200, category: "Gift", icon: "🛒", date: "2026-04-01", recurring: true, frequency: "monthly", nextDate: "2026-05-01", groupId: "g2", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "in-ev1-1", title: "Wedding gift fund", amount: 500, category: "Gift", icon: "💝", date: "2026-04-01", recurring: false, groupId: "g1", eventId: "ev1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
]

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

export const shoppingItems: ShoppingItem[] = [
  { id: "1", name: "Milk", category: "Dairy", quantity: 2, unit: "gal", estimatedPrice: 7.98, checked: false, store: "Whole Foods", icon: "🥛", groupId: "g1", createdAt: "2026-04-08", updatedAt: "2026-04-08" },
  { id: "2", name: "Eggs", category: "Dairy", quantity: 1, unit: "dozen", estimatedPrice: 4.99, checked: true, store: "Whole Foods", icon: "🥚", groupId: "g1", createdAt: "2026-04-08", updatedAt: "2026-04-10" },
  { id: "3", name: "Bread", category: "Bakery", quantity: 1, unit: "loaf", estimatedPrice: 3.49, checked: false, store: "Whole Foods", icon: "🍞", groupId: "g1", createdAt: "2026-04-08", updatedAt: "2026-04-08" },
  { id: "4", name: "Chicken Breast", category: "Meat", quantity: 2, unit: "lb", estimatedPrice: 11.98, checked: false, store: "Costco", icon: "🍗", groupId: "g1", createdAt: "2026-04-08", updatedAt: "2026-04-08" },
  { id: "5", name: "Spinach", category: "Produce", quantity: 1, unit: "bag", estimatedPrice: 3.99, checked: false, store: "Whole Foods", icon: "🥬", groupId: "g1", createdAt: "2026-04-08", updatedAt: "2026-04-08" },
  { id: "6", name: "Pasta", category: "Pantry", quantity: 2, unit: "box", estimatedPrice: 3.98, checked: true, store: "Target", icon: "🍝", groupId: "g1", createdAt: "2026-04-05", updatedAt: "2026-04-09" },
  { id: "7", name: "Olive Oil", category: "Pantry", quantity: 1, unit: "bottle", estimatedPrice: 8.99, checked: false, store: "Costco", icon: "🫙", groupId: "g1", createdAt: "2026-04-05", updatedAt: "2026-04-05" },
  { id: "8", name: "Yogurt", category: "Dairy", quantity: 4, unit: "cup", estimatedPrice: 5.96, checked: false, store: "Whole Foods", icon: "🥛", groupId: "g1", createdAt: "2026-04-08", updatedAt: "2026-04-08" },
  { id: "9", name: "Bananas", category: "Produce", quantity: 1, unit: "bunch", estimatedPrice: 1.79, checked: true, store: "Whole Foods", icon: "🍌", groupId: "g1", createdAt: "2026-04-08", updatedAt: "2026-04-10" },
  { id: "10", name: "Coffee", category: "Pantry", quantity: 1, unit: "bag", estimatedPrice: 12.99, checked: false, store: "Target", icon: "☕", groupId: "g1", createdAt: "2026-04-05", updatedAt: "2026-04-05" },
  { id: "11", name: "Toilet Paper", category: "Household", quantity: 1, unit: "pack", estimatedPrice: 18.99, checked: false, store: "Costco", icon: "🧻", groupId: "g1", createdAt: "2026-04-05", updatedAt: "2026-04-05" },
  { id: "12", name: "Dish Soap", category: "Household", quantity: 1, unit: "bottle", estimatedPrice: 3.49, checked: false, store: "Target", icon: "🧴", groupId: "g1", createdAt: "2026-04-05", updatedAt: "2026-04-05" },
  { id: "s-g2-1", name: "Apples", category: "Produce", quantity: 6, unit: "pcs", estimatedPrice: 3.99, checked: false, store: "Coles", icon: "🍎", groupId: "g2", createdAt: "2026-04-07", updatedAt: "2026-04-07" },
  { id: "s-g2-2", name: "Bread", category: "Bakery", quantity: 1, unit: "loaf", estimatedPrice: 3.49, checked: false, store: "Coles", icon: "🍞", groupId: "g2", createdAt: "2026-04-07", updatedAt: "2026-04-07" },
  { id: "s-g2-3", name: "Chicken Thighs", category: "Meat", quantity: 1, unit: "kg", estimatedPrice: 8.99, checked: true, store: "Coles", icon: "🍗", groupId: "g2", createdAt: "2026-04-07", updatedAt: "2026-04-09" },
  { id: "s-g2-4", name: "Milo", category: "Pantry", quantity: 1, unit: "tin", estimatedPrice: 9.99, checked: false, store: "Woolworths", icon: "☕", groupId: "g2", createdAt: "2026-04-07", updatedAt: "2026-04-07" },
  { id: "s-ev1-1", name: "Wedding favours", category: "Decorations", quantity: 80, unit: "pcs", estimatedPrice: 160, checked: false, store: "Etsy", icon: "🎁", groupId: "g1", eventId: "ev1", createdAt: "2026-03-20", updatedAt: "2026-03-20" },
  { id: "s-ev1-2", name: "Guest book", category: "Stationery", quantity: 1, unit: "pcs", estimatedPrice: 35, checked: true, store: "Officeworks", icon: "📖", groupId: "g1", eventId: "ev1", createdAt: "2026-03-20", updatedAt: "2026-04-02" },
  { id: "s-ev1-3", name: "Table centrepieces", category: "Decorations", quantity: 12, unit: "pcs", estimatedPrice: 240, checked: false, store: "Florist", icon: "💐", groupId: "g1", eventId: "ev1", createdAt: "2026-03-25", updatedAt: "2026-03-25" },
]

export type UserProfile = {
  name: string
  email: string
  initials: string
  currency: string
  timezone: string
  notifications: {
    budgetAlerts: boolean
    taskReminders: boolean
    weeklyReport: boolean
  }
}

export const userProfile: UserProfile = {
  name: "Manas Mallick",
  email: "manas@myhome.manasconsults.net",
  initials: "MM",
  currency: "AUD",
  timezone: "Australia/Brisbane",
  notifications: {
    budgetAlerts: true,
    taskReminders: true,
    weeklyReport: false,
  },
}

// CalendarEvent
export type CalendarEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM, omit for all-day
  category: "appointment" | "birthday" | "holiday" | "reminder" | "social"
  allDay: boolean
  icon: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export const calendarEvents: CalendarEvent[] = [
  { id: "1", title: "Pay rent", date: "2026-04-01", category: "reminder", allDay: true, icon: "🏠", groupId: "g1", createdAt: "2026-03-25", updatedAt: "2026-03-25" },
  { id: "2", title: "Doctor appointment", date: "2026-04-03", time: "10:30", category: "appointment", allDay: false, icon: "🏥", groupId: "g1", createdAt: "2026-03-27", updatedAt: "2026-03-27" },
  { id: "3", title: "Sarah's birthday", date: "2026-04-05", category: "birthday", allDay: true, icon: "🎂", groupId: "g1", createdAt: "2026-03-29", updatedAt: "2026-03-29" },
  { id: "4", title: "Home insurance renewal", date: "2026-04-07", category: "reminder", allDay: true, icon: "📋", groupId: "g1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "5", title: "Dinner with family", date: "2026-04-12", time: "19:00", category: "social", allDay: false, icon: "🍽️", groupId: "g1", createdAt: "2026-04-05", updatedAt: "2026-04-05" },
  { id: "6", title: "Plumber visit", date: "2026-04-14", time: "09:00", category: "appointment", allDay: false, icon: "🔧", groupId: "g1", createdAt: "2026-04-07", updatedAt: "2026-04-07" },
  { id: "7", title: "Earth Day", date: "2026-04-22", category: "holiday", allDay: true, icon: "🌍", groupId: "g1", createdAt: "2026-04-15", updatedAt: "2026-04-15" },
  { id: "8", title: "Car service", date: "2026-04-24", time: "11:00", category: "appointment", allDay: false, icon: "🚗", groupId: "g1", createdAt: "2026-04-17", updatedAt: "2026-04-17" },
  { id: "9", title: "Monthly budget review", date: "2026-04-28", time: "20:00", category: "reminder", allDay: false, icon: "💰", groupId: "g1", createdAt: "2026-04-21", updatedAt: "2026-04-21" },
  { id: "10", title: "Neighbour's housewarming", date: "2026-04-30", time: "18:00", category: "social", allDay: false, icon: "🏡", groupId: "g1", createdAt: "2026-04-23", updatedAt: "2026-04-23" },
  { id: "c-g2-1", title: "Mum's birthday", date: "2026-04-18", category: "birthday", allDay: true, icon: "🎂", groupId: "g2", createdAt: "2026-04-11", updatedAt: "2026-04-11" },
  { id: "c-g2-2", title: "HVAC service", date: "2026-04-22", time: "09:00", category: "appointment", allDay: false, icon: "🔧", groupId: "g2", createdAt: "2026-04-15", updatedAt: "2026-04-15" },
  { id: "c-ev1-1", title: "Venue viewing", date: "2026-04-15", time: "14:00", category: "appointment", allDay: false, icon: "🏛️", groupId: "g1", eventId: "ev1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "c-ev1-2", title: "Engagement party", date: "2026-05-10", time: "18:00", category: "social", allDay: false, icon: "💍", groupId: "g1", eventId: "ev1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
  { id: "c-ev1-3", title: "Wedding day", date: "2026-09-15", category: "social", allDay: true, icon: "💒", groupId: "g1", eventId: "ev1", createdAt: "2026-04-01", updatedAt: "2026-04-01" },
]

// Note
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

export const notes: Note[] = [
  { id: "1", title: "Home repair checklist", content: "Fix leaky faucet in bathroom. Replace kitchen light bulb. Re-caulk shower. Check smoke detector batteries.", category: "Home", pinned: true, color: "blue", createdAt: "2026-03-25", updatedAt: "2026-03-30", groupId: "g1" },
  { id: "2", title: "Monthly budget goals", content: "Reduce dining out to $200/month. Increase savings rate to 30%. Cancel unused subscriptions — check streaming services.", category: "Finance", pinned: true, color: "green", createdAt: "2026-03-23", updatedAt: "2026-03-28", groupId: "g1" },
  { id: "3", title: "Grocery meal prep ideas", content: "Sunday meal prep: roast chicken, quinoa salad, overnight oats. Stock up on pantry staples this week.", category: "Home", pinned: false, color: "yellow", createdAt: "2026-03-20", updatedAt: "2026-03-25", groupId: "g1" },
  { id: "4", title: "Garden plan spring 2026", content: "Plant tomatoes and basil in raised bed. Add herbs: rosemary, thyme, mint. Water twice a week through April.", category: "Home", pinned: false, color: "green", createdAt: "2026-03-17", updatedAt: "2026-03-22", groupId: "g1" },
  { id: "5", title: "WiFi password & accounts", content: "Network: HomeNet_5G | Password: stored in 1Password. Router admin: 192.168.1.1", category: "Home", pinned: true, color: "rose", createdAt: "2026-03-15", updatedAt: "2026-03-20", groupId: "g1" },
  { id: "6", title: "Vacation savings target", content: "Goal: $3,000 by August for summer trip. Current: $1,240. Need to save $290/month for 6 months.", category: "Finance", pinned: false, color: "blue", createdAt: "2026-03-13", updatedAt: "2026-03-18", groupId: "g1" },
  { id: "7", title: "Contractor contacts", content: "Plumber: Mike's Plumbing 555-0182. Electrician: FastFix Electric 555-0247. HVAC: CoolAir 555-0391.", category: "Home", pinned: false, color: "default", createdAt: "2026-03-10", updatedAt: "2026-03-15", groupId: "g1" },
  { id: "8", title: "Subscription audit", content: "Netflix $15.99 ✓ | Spotify $9.99 ✓ | Gym $45 ✓ | Adobe $54.99 — consider cancelling | iCloud $2.99 ✓", category: "Finance", pinned: false, color: "yellow", createdAt: "2026-03-05", updatedAt: "2026-03-10", groupId: "g1" },
  { id: "n-g2-1", title: "Mum's house maintenance", content: "Annual gutter clean due July. Pool filter needs replacing. Back fence boards rotting on south side.", category: "Home", pinned: true, color: "blue", createdAt: "2026-03-27", updatedAt: "2026-04-01", groupId: "g2" },
  { id: "n-g2-2", title: "Sydney visit reminders", content: "Check smoke alarms on arrival. Water the plants if staying more than 3 days. Bin day is Tuesday.", category: "Home", pinned: false, color: "yellow", createdAt: "2026-03-15", updatedAt: "2026-03-20", groupId: "g2" },
  { id: "n-ev1-1", title: "Wedding guest list", content: "Total: 78 guests confirmed. 12 pending RSVP. Table plan needed by May 15. Dietary: 4 vegan, 2 gluten-free.", category: "Planning", pinned: true, color: "rose", createdAt: "2026-04-01", updatedAt: "2026-04-05", groupId: "g1", eventId: "ev1" },
  { id: "n-ev1-2", title: "Venue requirements", content: "Venue capacity: 100. Setup from 10am. No outside catering. In-house AV. Parking for 40 cars.", category: "Venue", pinned: true, color: "green", createdAt: "2026-04-01", updatedAt: "2026-04-03", groupId: "g1", eventId: "ev1" },
  { id: "n-ev1-3", title: "Vendor contacts", content: "Florist: Bloom & Co 0412-555-001. DJ: SoundWave Events 0421-555-002. MC: James Thompson 0433-555-003.", category: "Vendors", pinned: false, color: "default", createdAt: "2026-03-23", updatedAt: "2026-03-28", groupId: "g1", eventId: "ev1" },
]

// Recipe & Meal Plan
export type Recipe = {
  id: string
  name: string
  mealType: "breakfast" | "lunch" | "dinner"
  prepTime: number // minutes
  calories: number
  servings: number
  tags: string[]
  icon: string
  createdAt: string
  updatedAt: string
}

export const recipes: Recipe[] = [
  { id: "1", name: "Overnight Oats", mealType: "breakfast", prepTime: 5, calories: 380, servings: 1, tags: ["quick", "healthy", "meal-prep"], icon: "🥣", createdAt: "2026-01-05", updatedAt: "2026-01-05" },
  { id: "2", name: "Avocado Toast", mealType: "breakfast", prepTime: 10, calories: 320, servings: 1, tags: ["quick", "vegetarian"], icon: "🥑", createdAt: "2026-01-08", updatedAt: "2026-02-12" },
  { id: "3", name: "Greek Yogurt Bowl", mealType: "breakfast", prepTime: 5, calories: 290, servings: 1, tags: ["quick", "high-protein"], icon: "🍓", createdAt: "2026-01-10", updatedAt: "2026-01-10" },
  { id: "4", name: "Chicken Caesar Salad", mealType: "lunch", prepTime: 15, calories: 420, servings: 2, tags: ["healthy", "high-protein"], icon: "🥗", createdAt: "2026-01-12", updatedAt: "2026-03-01" },
  { id: "5", name: "Turkey Sandwich", mealType: "lunch", prepTime: 10, calories: 380, servings: 1, tags: ["quick"], icon: "🥪", createdAt: "2026-01-15", updatedAt: "2026-01-15" },
  { id: "6", name: "Lentil Soup", mealType: "lunch", prepTime: 35, calories: 310, servings: 4, tags: ["meal-prep", "vegetarian"], icon: "🍲", createdAt: "2026-01-20", updatedAt: "2026-02-20" },
  { id: "7", name: "Grilled Salmon", mealType: "dinner", prepTime: 25, calories: 520, servings: 2, tags: ["healthy", "high-protein"], icon: "🐟", createdAt: "2026-01-22", updatedAt: "2026-03-10" },
  { id: "8", name: "Pasta Bolognese", mealType: "dinner", prepTime: 40, calories: 680, servings: 4, tags: ["meal-prep", "comfort"], icon: "🍝", createdAt: "2026-02-01", updatedAt: "2026-02-01" },
  { id: "9", name: "Stir-fry Chicken & Veg", mealType: "dinner", prepTime: 20, calories: 460, servings: 2, tags: ["quick", "healthy"], icon: "🥘", createdAt: "2026-02-05", updatedAt: "2026-04-03" },
  { id: "10", name: "Roast Chicken", mealType: "dinner", prepTime: 90, calories: 590, servings: 4, tags: ["meal-prep", "comfort"], icon: "🍗", createdAt: "2026-02-10", updatedAt: "2026-02-10" },
]

export type DayMeals = {
  day: string // "Mon" | "Tue" etc
  breakfast: string // recipe id
  lunch: string
  dinner: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export const weeklyMealPlan: DayMeals[] = [
  { day: "Mon", breakfast: "1", lunch: "4", dinner: "7", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Tue", breakfast: "2", lunch: "5", dinner: "8", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Wed", breakfast: "3", lunch: "6", dinner: "9", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-09" },
  { day: "Thu", breakfast: "1", lunch: "4", dinner: "10", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Fri", breakfast: "2", lunch: "5", dinner: "7", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-10" },
  { day: "Sat", breakfast: "3", lunch: "", dinner: "8", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Sun", breakfast: "", lunch: "", dinner: "10", groupId: "g1", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Mon", breakfast: "1", lunch: "5", dinner: "8", groupId: "g2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Tue", breakfast: "2", lunch: "4", dinner: "9", groupId: "g2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Wed", breakfast: "3", lunch: "6", dinner: "10", groupId: "g2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Thu", breakfast: "1", lunch: "5", dinner: "7", groupId: "g2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Fri", breakfast: "2", lunch: "4", dinner: "8", groupId: "g2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Sat", breakfast: "3", lunch: "", dinner: "10", groupId: "g2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
  { day: "Sun", breakfast: "", lunch: "", dinner: "9", groupId: "g2", createdAt: "2026-04-06", updatedAt: "2026-04-06" },
]

export type Loan = {
  id: string
  direction: "lent" | "borrowed"
  contact: string
  principal: number
  interestRate: number   // annual simple interest %
  startDate: string      // YYYY-MM-DD
  dueDate?: string       // YYYY-MM-DD
  notes?: string
  groupId: string
  eventId?: string
  createdAt: string
  updatedAt: string
}

export type LoanRepayment = {
  id: string
  loanId: string
  amount: number
  date: string           // YYYY-MM-DD
  note?: string
  createdAt: string
  updatedAt: string
}

export const loans: Loan[] = [
  { id: "loan-1", direction: "lent",     contact: "Alex",   principal: 500,  interestRate: 0, startDate: "2026-01-15", dueDate: "2026-06-15", groupId: "g1", createdAt: "2026-01-15", updatedAt: "2026-01-15" },
  { id: "loan-2", direction: "lent",     contact: "Sam",    principal: 1200, interestRate: 5, startDate: "2025-11-01", dueDate: "2026-05-01", groupId: "g1", createdAt: "2025-11-01", updatedAt: "2026-01-10" },
  { id: "loan-3", direction: "lent",     contact: "Chris",  principal: 300,  interestRate: 0, startDate: "2025-07-01", dueDate: "2025-12-31", groupId: "g1", createdAt: "2025-07-01", updatedAt: "2025-12-15" },
  { id: "loan-4", direction: "borrowed", contact: "Mum",    principal: 3000, interestRate: 0, startDate: "2026-02-01", groupId: "g1", notes: "For home renovations", createdAt: "2026-02-01", updatedAt: "2026-03-05" },
  { id: "loan-5", direction: "borrowed", contact: "Jordan", principal: 450,  interestRate: 0, startDate: "2025-09-01", groupId: "g1", createdAt: "2025-09-01", updatedAt: "2026-01-20" },
  { id: "loan-6", direction: "lent",     contact: "Dad",    principal: 1000, interestRate: 0, startDate: "2026-01-01", groupId: "g2", createdAt: "2026-01-01", updatedAt: "2026-02-15" },
]

export const loanRepayments: LoanRepayment[] = [
  { id: "rep-1", loanId: "loan-1", amount: 200, date: "2026-02-10", createdAt: "2026-02-10", updatedAt: "2026-02-18" },
  { id: "rep-2", loanId: "loan-2", amount: 300, date: "2026-01-15", createdAt: "2026-01-15", updatedAt: "2026-01-15" },
  { id: "rep-3", loanId: "loan-5", amount: 450, date: "2026-01-20", note: "Full repayment", createdAt: "2026-01-20", updatedAt: "2026-01-20" },
  { id: "rep-4", loanId: "loan-6", amount: 200, date: "2026-02-15", createdAt: "2026-02-15", updatedAt: "2026-03-01" },
]
