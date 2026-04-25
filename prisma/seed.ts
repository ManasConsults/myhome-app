import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function d(s: string): Date { return new Date(s) }

async function main() {
  // ── Users ──────────────────────────────────────────────────────────────────
  const seedUser = await prisma.user.upsert({
    where: { email: "demo@myhome.app" },
    update: {},
    create: {
      name: "Manas Mallick",
      email: "demo@myhome.app",
      password: "demo1234",
      role: "admin",
      status: "active",
      createdAt: d("2024-01-01"),
    },
  })

  // ── Groups ─────────────────────────────────────────────────────────────────
  const g1 = await prisma.group.upsert({
    where: { id: "g1" },
    update: {},
    create: {
      id: "g1", name: "My Home", type: "household", icon: "🏠", color: "primary",
      currency: "AUD", location: "Brisbane", isDefault: true, userId: seedUser.id,
      createdAt: d("2024-01-01"), updatedAt: d("2026-01-15"),
    },
  })
  const g2 = await prisma.group.upsert({
    where: { id: "g2" },
    update: {},
    create: {
      id: "g2", name: "Mum's House", type: "household", icon: "🏡", color: "success",
      currency: "INR", location: "Hyderabad", isDefault: false, userId: seedUser.id,
      createdAt: d("2024-06-01"), updatedAt: d("2025-11-20"),
    },
  })

  // ── AppEvents ──────────────────────────────────────────────────────────────
  await prisma.appEvent.upsert({
    where: { id: "ev1" },
    update: {},
    create: {
      id: "ev1", groupId: g1.id, name: "Wedding 2026", icon: "💍", color: "destructive",
      startDate: d("2026-09-15"), description: "Sarah & Tom's wedding",
      createdAt: d("2026-01-10"), updatedAt: d("2026-03-05"),
    },
  })
  await prisma.appEvent.upsert({
    where: { id: "ev2" },
    update: {},
    create: {
      id: "ev2", groupId: g1.id, name: "Europe Trip", icon: "✈️", color: "warning",
      startDate: d("2026-07-01"), endDate: d("2026-07-21"), description: "Summer holiday",
      createdAt: d("2026-02-20"), updatedAt: d("2026-04-01"),
    },
  })

  // ── Recipes (unscoped) ────────────────────────────────────────────────────
  const recipeData = [
    { id: "r1",  name: "Overnight Oats",        mealType: "breakfast", prepTime: 5,  calories: 380, servings: 1, tags: ["quick","healthy","meal-prep"], icon: "🥣", createdAt: d("2026-01-05"), updatedAt: d("2026-01-05") },
    { id: "r2",  name: "Avocado Toast",          mealType: "breakfast", prepTime: 10, calories: 320, servings: 1, tags: ["quick","vegetarian"],         icon: "🥑", createdAt: d("2026-01-08"), updatedAt: d("2026-02-12") },
    { id: "r3",  name: "Greek Yogurt Bowl",      mealType: "breakfast", prepTime: 5,  calories: 290, servings: 1, tags: ["quick","high-protein"],       icon: "🍓", createdAt: d("2026-01-10"), updatedAt: d("2026-01-10") },
    { id: "r4",  name: "Chicken Caesar Salad",   mealType: "lunch",     prepTime: 15, calories: 420, servings: 2, tags: ["healthy","high-protein"],     icon: "🥗", createdAt: d("2026-01-12"), updatedAt: d("2026-03-01") },
    { id: "r5",  name: "Turkey Sandwich",        mealType: "lunch",     prepTime: 10, calories: 380, servings: 1, tags: ["quick"],                      icon: "🥪", createdAt: d("2026-01-15"), updatedAt: d("2026-01-15") },
    { id: "r6",  name: "Lentil Soup",            mealType: "lunch",     prepTime: 35, calories: 310, servings: 4, tags: ["meal-prep","vegetarian"],     icon: "🍲", createdAt: d("2026-01-20"), updatedAt: d("2026-02-20") },
    { id: "r7",  name: "Grilled Salmon",         mealType: "dinner",    prepTime: 25, calories: 520, servings: 2, tags: ["healthy","high-protein"],     icon: "🐟", createdAt: d("2026-01-22"), updatedAt: d("2026-03-10") },
    { id: "r8",  name: "Pasta Bolognese",        mealType: "dinner",    prepTime: 40, calories: 680, servings: 4, tags: ["meal-prep","comfort"],        icon: "🍝", createdAt: d("2026-02-01"), updatedAt: d("2026-02-01") },
    { id: "r9",  name: "Stir-fry Chicken & Veg", mealType: "dinner",   prepTime: 20, calories: 460, servings: 2, tags: ["quick","healthy"],            icon: "🥘", createdAt: d("2026-02-05"), updatedAt: d("2026-04-03") },
    { id: "r10", name: "Roast Chicken",          mealType: "dinner",    prepTime: 90, calories: 590, servings: 4, tags: ["meal-prep","comfort"],        icon: "🍗", createdAt: d("2026-02-10"), updatedAt: d("2026-02-10") },
  ]
  for (const r of recipeData) {
    await prisma.recipe.upsert({ where: { id: r.id }, update: {}, create: r })
  }

  // ── Budgets ────────────────────────────────────────────────────────────────
  const budgetData = [
    { id: "b1",      name: "Groceries",            type: "monthly", category: "Food & Dining",   icon: "🛒", color: "var(--color-chart-2)", amount: 600,  spent: 206.7, startDate: d("2026-01-01"), period: "April 2026", groupId: g1.id, eventId: null },
    { id: "b2",      name: "Electricity & Gas",    type: "monthly", category: "Utilities",        icon: "⚡", color: "var(--color-chart-3)", amount: 300,  spent: 280,   startDate: d("2026-01-01"), period: "April 2026", groupId: g1.id, eventId: null },
    { id: "b3",      name: "Netflix & Streaming",  type: "monthly", category: "Entertainment",    icon: "🎬", color: "var(--color-chart-1)", amount: 50,   spent: 15.99, startDate: d("2026-01-01"), period: "April 2026", groupId: g1.id, eventId: null },
    { id: "b4",      name: "Gym & Health",         type: "monthly", category: "Health & Fitness", icon: "🏋️", color: "var(--color-chart-4)", amount: 150,  spent: 145,   startDate: d("2026-01-01"), period: "April 2026", groupId: g1.id, eventId: null },
    { id: "b5",      name: "Clothing & Shopping",  type: "monthly", category: "Shopping",         icon: "🛍️", color: "var(--color-chart-5)", amount: 200,  spent: 89.99, startDate: d("2026-01-01"), period: "April 2026", groupId: g1.id, eventId: null },
    { id: "b6",      name: "Annual Holiday",       type: "yearly",  category: "Travel",           icon: "✈️", color: "var(--color-chart-2)", amount: 5000, spent: 1240,  startDate: d("2026-01-01"), period: "2026",       groupId: g1.id, eventId: null },
    { id: "b7",      name: "Home Maintenance",     type: "yearly",  category: "Housing",          icon: "🏠", color: "var(--color-chart-3)", amount: 3000, spent: 3150,  startDate: d("2026-01-01"), period: "2026",       groupId: g1.id, eventId: null },
    { id: "b8",      name: "Education & Courses",  type: "yearly",  category: "Education",        icon: "📚", color: "var(--color-chart-4)", amount: 1200, spent: 299,   startDate: d("2026-01-01"), period: "2026",       groupId: g1.id, eventId: null },
    { id: "b-g2-1",  name: "Groceries",            type: "monthly", category: "Food & Dining",   icon: "🛒", color: "var(--color-chart-2)", amount: 400,  spent: 180,   startDate: d("2026-01-01"), period: "April 2026", groupId: g2.id, eventId: null },
    { id: "b-g2-2",  name: "Utilities",            type: "monthly", category: "Utilities",        icon: "⚡", color: "var(--color-chart-3)", amount: 250,  spent: 210,   startDate: d("2026-01-01"), period: "April 2026", groupId: g2.id, eventId: null },
    { id: "b-ev1-1", name: "Venue",                type: "yearly",  category: "Housing",          icon: "🏛️", color: "var(--color-chart-1)", amount: 8000, spent: 2000,  startDate: d("2026-01-01"), period: "2026",       groupId: g1.id, eventId: "ev1" },
    { id: "b-ev1-2", name: "Catering",             type: "yearly",  category: "Food & Dining",   icon: "🍽️", color: "var(--color-chart-2)", amount: 5000, spent: 1500,  startDate: d("2026-01-01"), period: "2026",       groupId: g1.id, eventId: "ev1" },
    { id: "b-ev1-3", name: "Photography",          type: "yearly",  category: "Entertainment",    icon: "📷", color: "var(--color-chart-4)", amount: 3000, spent: 500,   startDate: d("2026-01-01"), period: "2026",       groupId: g1.id, eventId: "ev1" },
  ]
  for (const b of budgetData) {
    await prisma.budget.upsert({ where: { id: b.id }, update: {}, create: b })
  }

  // ── Expenses ───────────────────────────────────────────────────────────────
  const expenseData = [
    { id: "e1",      title: "Rent",               amount: 2200,  category: "Housing",         icon: "🏠", date: d("2026-04-01"), recurring: true,  frequency: "monthly",      nextDate: d("2026-05-01"), budgetId: null, groupId: g1.id, eventId: null },
    { id: "e2",      title: "Netflix",             amount: 15.99, category: "Entertainment",   icon: "🎬", date: d("2026-04-03"), recurring: true,  frequency: "monthly",      nextDate: d("2026-05-03"), budgetId: "b3", groupId: g1.id, eventId: null },
    { id: "e3",      title: "Gym Membership",      amount: 45,    category: "Health & Fitness", icon: "🏋️", date: d("2026-04-05"), recurring: true,  frequency: "monthly",      nextDate: d("2026-05-05"), budgetId: "b4", groupId: g1.id, eventId: null },
    { id: "e4",      title: "Spotify",             amount: 9.99,  category: "Entertainment",   icon: "🎵", date: d("2026-04-08"), recurring: true,  frequency: "monthly",      nextDate: d("2026-05-08"), budgetId: "b3", groupId: g1.id, eventId: null },
    { id: "e5",      title: "Internet Bill",       amount: 79,    category: "Utilities",        icon: "📡", date: d("2026-04-10"), recurring: true,  frequency: "monthly",      nextDate: d("2026-05-10"), budgetId: "b2", groupId: g1.id, eventId: null },
    { id: "e6",      title: "Groceries",           amount: 120,   category: "Food & Dining",   icon: "🛒", date: d("2026-04-07"), recurring: true,  frequency: "weekly",       nextDate: d("2026-04-14"), budgetId: "b1", groupId: g1.id, eventId: null },
    { id: "e7",      title: "Cleaner",             amount: 85,    category: "Housing",         icon: "🧹", date: d("2026-04-04"), recurring: true,  frequency: "fortnightly",  nextDate: d("2026-04-18"), budgetId: null, groupId: g1.id, eventId: null },
    { id: "e8",      title: "Home Insurance",      amount: 1200,  category: "Housing",         icon: "🏡", date: d("2026-01-15"), recurring: true,  frequency: "yearly",       nextDate: d("2027-01-15"), budgetId: null, groupId: g1.id, eventId: null },
    { id: "e9",      title: "Car Registration",    amount: 380,   category: "Transportation",  icon: "🚗", date: d("2026-03-01"), recurring: true,  frequency: "yearly",       nextDate: d("2027-03-01"), budgetId: null, groupId: g1.id, eventId: null },
    { id: "e10",     title: "Dentist Appointment", amount: 220,   category: "Health & Fitness", icon: "🦷", date: d("2026-04-02"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: null },
    { id: "e11",     title: "New Running Shoes",   amount: 149.99, category: "Shopping",       icon: "👟", date: d("2026-04-04"), recurring: false, frequency: null,           nextDate: null,            budgetId: "b5", groupId: g1.id, eventId: null },
    { id: "e12",     title: "Restaurant — Date Night", amount: 98.5, category: "Food & Dining", icon: "🍽️", date: d("2026-04-06"), recurring: false, frequency: null,         nextDate: null,            budgetId: "b1", groupId: g1.id, eventId: null },
    { id: "e13",     title: "Uber",                amount: 24.8,  category: "Transportation",  icon: "🚕", date: d("2026-04-06"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: null },
    { id: "e14",     title: "Coffee Machine Repair", amount: 65,  category: "Housing",         icon: "☕", date: d("2026-03-28"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: null },
    { id: "ex-g2-1", title: "Rent contribution",   amount: 800,  category: "Housing",         icon: "🏡", date: d("2026-04-01"), recurring: true,  frequency: "monthly",      nextDate: d("2026-05-01"), budgetId: null, groupId: g2.id, eventId: null },
    { id: "ex-g2-2", title: "Water bill",          amount: 65,   category: "Utilities",        icon: "💧", date: d("2026-04-03"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g2.id, eventId: null },
    { id: "ex-ev1-1", title: "Venue deposit",      amount: 2000, category: "Housing",         icon: "🏛️", date: d("2026-03-15"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: "ev1" },
    { id: "ex-ev1-2", title: "Catering deposit",   amount: 1500, category: "Food & Dining",   icon: "🍽️", date: d("2026-03-20"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: "ev1" },
    { id: "ex-ev1-3", title: "Photographer deposit", amount: 500, category: "Entertainment",  icon: "📷", date: d("2026-04-01"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: "ev1" },
    { id: "ex-ev2-1", title: "Flight booking",     amount: 1200, category: "Travel",          icon: "✈️", date: d("2026-04-05"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: "ev2" },
    { id: "ex-ev2-2", title: "Travel insurance",   amount: 180,  category: "Travel",          icon: "🛡️", date: d("2026-04-06"), recurring: false, frequency: null,           nextDate: null,            budgetId: null, groupId: g1.id, eventId: "ev2" },
  ]
  for (const e of expenseData) {
    await prisma.expense.upsert({ where: { id: e.id }, update: {}, create: e })
  }

  // ── Incomes ────────────────────────────────────────────────────────────────
  const incomeData = [
    { id: "i1",     title: "Salary",                    amount: 5200, category: "Salary",           icon: "💼", date: d("2026-04-20"), recurring: true,  frequency: "monthly",     nextDate: d("2026-05-20"), groupId: g1.id, eventId: null },
    { id: "i2",     title: "Rental Income",             amount: 1400, category: "Rental Income",    icon: "🏠", date: d("2026-04-01"), recurring: true,  frequency: "monthly",     nextDate: d("2026-05-01"), groupId: g1.id, eventId: null },
    { id: "i3",     title: "Dividend Payment",          amount: 180,  category: "Investment",       icon: "📈", date: d("2026-04-15"), recurring: true,  frequency: "monthly",     nextDate: d("2026-05-15"), groupId: g1.id, eventId: null },
    { id: "i4",     title: "Part-time Tutoring",        amount: 320,  category: "Freelance",        icon: "📖", date: d("2026-04-11"), recurring: true,  frequency: "fortnightly", nextDate: d("2026-04-25"), groupId: g1.id, eventId: null },
    { id: "i5",     title: "Tax Refund",                amount: 2400, category: "Government Benefits", icon: "🏛️", date: d("2026-07-01"), recurring: true, frequency: "yearly",    nextDate: d("2027-07-01"), groupId: g1.id, eventId: null },
    { id: "i6",     title: "Annual Bonus",              amount: 3500, category: "Salary",           icon: "🎁", date: d("2026-12-15"), recurring: true,  frequency: "yearly",     nextDate: d("2027-12-15"), groupId: g1.id, eventId: null },
    { id: "i7",     title: "Freelance Web Project",     amount: 1800, category: "Freelance",        icon: "💻", date: d("2026-04-05"), recurring: false, frequency: null,          nextDate: null,            groupId: g1.id, eventId: null },
    { id: "i8",     title: "Sold Old Furniture",        amount: 250,  category: "Other",            icon: "🪑", date: d("2026-04-03"), recurring: false, frequency: null,          nextDate: null,            groupId: g1.id, eventId: null },
    { id: "i9",     title: "Birthday Gift",             amount: 100,  category: "Gift",             icon: "🎂", date: d("2026-03-30"), recurring: false, frequency: null,          nextDate: null,            groupId: g1.id, eventId: null },
    { id: "i10",    title: "Consulting — Strategy Session", amount: 600, category: "Business Income", icon: "🤝", date: d("2026-03-25"), recurring: false, frequency: null,      nextDate: null,            groupId: g1.id, eventId: null },
    { id: "in-g2-1", title: "Grocery contribution",    amount: 200,  category: "Gift",             icon: "🛒", date: d("2026-04-01"), recurring: true,  frequency: "monthly",     nextDate: d("2026-05-01"), groupId: g2.id, eventId: null },
    { id: "in-ev1-1", title: "Wedding gift fund",      amount: 500,  category: "Gift",             icon: "💝", date: d("2026-04-01"), recurring: false, frequency: null,          nextDate: null,            groupId: g1.id, eventId: "ev1" },
  ]
  for (const i of incomeData) {
    await prisma.income.upsert({ where: { id: i.id }, update: {}, create: i })
  }

  // ── Loans ──────────────────────────────────────────────────────────────────
  const loanData = [
    { id: "loan-1", direction: "lent",     contact: "Alex",   principal: 500,  interestRate: 0, startDate: d("2026-01-15"), dueDate: d("2026-06-15"), notes: null, groupId: g1.id, eventId: null },
    { id: "loan-2", direction: "lent",     contact: "Sam",    principal: 1200, interestRate: 5, startDate: d("2025-11-01"), dueDate: d("2026-05-01"), notes: null, groupId: g1.id, eventId: null },
    { id: "loan-3", direction: "lent",     contact: "Chris",  principal: 300,  interestRate: 0, startDate: d("2025-07-01"), dueDate: d("2025-12-31"), notes: null, groupId: g1.id, eventId: null },
    { id: "loan-4", direction: "borrowed", contact: "Mum",    principal: 3000, interestRate: 0, startDate: d("2026-02-01"), dueDate: null,            notes: "For home renovations", groupId: g1.id, eventId: null },
    { id: "loan-5", direction: "borrowed", contact: "Jordan", principal: 450,  interestRate: 0, startDate: d("2025-09-01"), dueDate: null,            notes: null, groupId: g1.id, eventId: null },
    { id: "loan-6", direction: "lent",     contact: "Dad",    principal: 1000, interestRate: 0, startDate: d("2026-01-01"), dueDate: null,            notes: null, groupId: g2.id, eventId: null },
  ]
  for (const l of loanData) {
    await prisma.loan.upsert({ where: { id: l.id }, update: {}, create: l })
  }

  // ── Loan Repayments ────────────────────────────────────────────────────────
  const repaymentData = [
    { id: "rep-1", loanId: "loan-1", amount: 200, date: d("2026-02-10"), note: null },
    { id: "rep-2", loanId: "loan-2", amount: 300, date: d("2026-01-15"), note: null },
    { id: "rep-3", loanId: "loan-5", amount: 450, date: d("2026-01-20"), note: "Full repayment" },
    { id: "rep-4", loanId: "loan-6", amount: 200, date: d("2026-02-15"), note: null },
  ]
  for (const r of repaymentData) {
    await prisma.loanRepayment.upsert({ where: { id: r.id }, update: {}, create: r })
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const taskData = [
    { id: "t1",      title: "Pay electricity bill",   category: "Bills",        priority: "high",   done: false, due: d("2026-03-24"), icon: "⚡", groupId: g1.id, eventId: null },
    { id: "t2",      title: "Clean the kitchen",       category: "Chores",       priority: "medium", done: true,  due: d("2026-03-22"), icon: "🧹", groupId: g1.id, eventId: null },
    { id: "t3",      title: "Schedule plumber visit",  category: "Maintenance",  priority: "high",   done: false, due: d("2026-03-23"), icon: "🔧", groupId: g1.id, eventId: null },
    { id: "t4",      title: "Buy groceries",           category: "Shopping",     priority: "medium", done: false, due: d("2026-03-22"), icon: "🛒", groupId: g1.id, eventId: null },
    { id: "t5",      title: "Renew home insurance",    category: "Bills",        priority: "low",    done: false, due: d("2026-03-30"), icon: "🏠", groupId: g1.id, eventId: null },
    { id: "t6",      title: "Water the plants",        category: "Chores",       priority: "low",    done: true,  due: d("2026-03-21"), icon: "🌿", groupId: g1.id, eventId: null },
    { id: "t-g2-1",  title: "Fix back fence",          category: "Maintenance",  priority: "high",   done: false, due: d("2026-04-15"), icon: "🔨", groupId: g2.id, eventId: null },
    { id: "t-g2-2",  title: "Replace smoke alarms",    category: "Maintenance",  priority: "high",   done: false, due: d("2026-04-10"), icon: "🔔", groupId: g2.id, eventId: null },
    { id: "t-g2-3",  title: "Trim garden hedges",      category: "Chores",       priority: "low",    done: true,  due: d("2026-04-05"), icon: "🌿", groupId: g2.id, eventId: null },
    { id: "t-ev1-1", title: "Book wedding venue",      category: "Venue",        priority: "high",   done: true,  due: d("2026-02-01"), icon: "🏛️", groupId: g1.id, eventId: "ev1" },
    { id: "t-ev1-2", title: "Send invitations",        category: "Admin",        priority: "high",   done: false, due: d("2026-04-30"), icon: "✉️", groupId: g1.id, eventId: "ev1" },
    { id: "t-ev1-3", title: "Order wedding cake",      category: "Catering",     priority: "medium", done: false, due: d("2026-05-01"), icon: "🎂", groupId: g1.id, eventId: "ev1" },
    { id: "t-ev1-4", title: "Book photographer",       category: "Vendors",      priority: "high",   done: true,  due: d("2026-03-01"), icon: "📷", groupId: g1.id, eventId: "ev1" },
    { id: "t-ev2-1", title: "Book flights to London",  category: "Travel",       priority: "high",   done: false, due: d("2026-05-01"), icon: "✈️", groupId: g1.id, eventId: "ev2" },
    { id: "t-ev2-2", title: "Book hotels in Paris",    category: "Accommodation", priority: "high",  done: false, due: d("2026-05-15"), icon: "🏨", groupId: g1.id, eventId: "ev2" },
  ]
  for (const t of taskData) {
    await prisma.task.upsert({ where: { id: t.id }, update: {}, create: t })
  }

  // ── Shopping Items ─────────────────────────────────────────────────────────
  const shoppingData = [
    { id: "s1",      name: "Milk",              category: "Dairy",       quantity: 2,  unit: "gal",    estimatedPrice: 7.98,  checked: false, store: "Whole Foods",  icon: "🥛", groupId: g1.id, eventId: null },
    { id: "s2",      name: "Eggs",              category: "Dairy",       quantity: 1,  unit: "dozen",  estimatedPrice: 4.99,  checked: true,  store: "Whole Foods",  icon: "🥚", groupId: g1.id, eventId: null },
    { id: "s3",      name: "Bread",             category: "Bakery",      quantity: 1,  unit: "loaf",   estimatedPrice: 3.49,  checked: false, store: "Whole Foods",  icon: "🍞", groupId: g1.id, eventId: null },
    { id: "s4",      name: "Chicken Breast",    category: "Meat",        quantity: 2,  unit: "lb",     estimatedPrice: 11.98, checked: false, store: "Costco",       icon: "🍗", groupId: g1.id, eventId: null },
    { id: "s5",      name: "Spinach",           category: "Produce",     quantity: 1,  unit: "bag",    estimatedPrice: 3.99,  checked: false, store: "Whole Foods",  icon: "🥬", groupId: g1.id, eventId: null },
    { id: "s6",      name: "Pasta",             category: "Pantry",      quantity: 2,  unit: "box",    estimatedPrice: 3.98,  checked: true,  store: "Target",       icon: "🍝", groupId: g1.id, eventId: null },
    { id: "s7",      name: "Olive Oil",         category: "Pantry",      quantity: 1,  unit: "bottle", estimatedPrice: 8.99,  checked: false, store: "Costco",       icon: "🫙", groupId: g1.id, eventId: null },
    { id: "s8",      name: "Yogurt",            category: "Dairy",       quantity: 4,  unit: "cup",    estimatedPrice: 5.96,  checked: false, store: "Whole Foods",  icon: "🥛", groupId: g1.id, eventId: null },
    { id: "s9",      name: "Bananas",           category: "Produce",     quantity: 1,  unit: "bunch",  estimatedPrice: 1.79,  checked: true,  store: "Whole Foods",  icon: "🍌", groupId: g1.id, eventId: null },
    { id: "s10",     name: "Coffee",            category: "Pantry",      quantity: 1,  unit: "bag",    estimatedPrice: 12.99, checked: false, store: "Target",       icon: "☕", groupId: g1.id, eventId: null },
    { id: "s11",     name: "Toilet Paper",      category: "Cleaning",    quantity: 1,  unit: "pack",   estimatedPrice: 18.99, checked: false, store: "Costco",       icon: "🧻", groupId: g1.id, eventId: null },
    { id: "s12",     name: "Dish Soap",         category: "Cleaning",    quantity: 1,  unit: "bottle", estimatedPrice: 3.49,  checked: false, store: "Target",       icon: "🧴", groupId: g1.id, eventId: null },
    { id: "s-g2-1",  name: "Apples",            category: "Produce",     quantity: 6,  unit: "pcs",    estimatedPrice: 3.99,  checked: false, store: "Coles",        icon: "🍎", groupId: g2.id, eventId: null },
    { id: "s-g2-2",  name: "Bread",             category: "Bakery",      quantity: 1,  unit: "loaf",   estimatedPrice: 3.49,  checked: false, store: "Coles",        icon: "🍞", groupId: g2.id, eventId: null },
    { id: "s-g2-3",  name: "Chicken Thighs",    category: "Meat",        quantity: 1,  unit: "kg",     estimatedPrice: 8.99,  checked: true,  store: "Coles",        icon: "🍗", groupId: g2.id, eventId: null },
    { id: "s-g2-4",  name: "Milo",              category: "Snacks",      quantity: 1,  unit: "tin",    estimatedPrice: 9.99,  checked: false, store: "Woolworths",   icon: "☕", groupId: g2.id, eventId: null },
    { id: "s-ev1-1", name: "Wedding favours",   category: "Personal Care", quantity: 80, unit: "pcs",  estimatedPrice: 160,   checked: false, store: "Etsy",         icon: "🎁", groupId: g1.id, eventId: "ev1" },
    { id: "s-ev1-2", name: "Guest book",        category: "Other",       quantity: 1,  unit: "pcs",    estimatedPrice: 35,    checked: true,  store: "Officeworks",  icon: "📖", groupId: g1.id, eventId: "ev1" },
    { id: "s-ev1-3", name: "Table centrepieces", category: "Other",      quantity: 12, unit: "pcs",    estimatedPrice: 240,   checked: false, store: "Florist",      icon: "💐", groupId: g1.id, eventId: "ev1" },
  ]
  for (const s of shoppingData) {
    await prisma.shoppingItem.upsert({ where: { id: s.id }, update: {}, create: s })
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  const noteData = [
    { id: "n1",      title: "Home repair checklist",     content: "Fix leaky faucet in bathroom. Replace kitchen light bulb. Re-caulk shower. Check smoke detector batteries.",                                        category: "Home",     pinned: true,  color: "blue",    groupId: g1.id, eventId: null },
    { id: "n2",      title: "Monthly budget goals",      content: "Reduce dining out to $200/month. Increase savings rate to 30%. Cancel unused subscriptions — check streaming services.",                              category: "Finance",  pinned: true,  color: "green",   groupId: g1.id, eventId: null },
    { id: "n3",      title: "Grocery meal prep ideas",   content: "Sunday meal prep: roast chicken, quinoa salad, overnight oats. Stock up on pantry staples this week.",                                               category: "Home",     pinned: false, color: "yellow",  groupId: g1.id, eventId: null },
    { id: "n4",      title: "Garden plan spring 2026",   content: "Plant tomatoes and basil in raised bed. Add herbs: rosemary, thyme, mint. Water twice a week through April.",                                        category: "Home",     pinned: false, color: "green",   groupId: g1.id, eventId: null },
    { id: "n5",      title: "WiFi password & accounts",  content: "Network: HomeNet_5G | Password: stored in 1Password. Router admin: 192.168.1.1",                                                                     category: "Home",     pinned: true,  color: "rose",    groupId: g1.id, eventId: null },
    { id: "n6",      title: "Vacation savings target",   content: "Goal: $3,000 by August for summer trip. Current: $1,240. Need to save $290/month for 6 months.",                                                     category: "Finance",  pinned: false, color: "blue",    groupId: g1.id, eventId: null },
    { id: "n7",      title: "Contractor contacts",       content: "Plumber: Mike's Plumbing 555-0182. Electrician: FastFix Electric 555-0247. HVAC: CoolAir 555-0391.",                                                 category: "Home",     pinned: false, color: "default", groupId: g1.id, eventId: null },
    { id: "n8",      title: "Subscription audit",        content: "Netflix $15.99 ✓ | Spotify $9.99 ✓ | Gym $45 ✓ | Adobe $54.99 — consider cancelling | iCloud $2.99 ✓",                                               category: "Finance",  pinned: false, color: "yellow",  groupId: g1.id, eventId: null },
    { id: "n-g2-1",  title: "Mum's house maintenance",  content: "Annual gutter clean due July. Pool filter needs replacing. Back fence boards rotting on south side.",                                                  category: "Home",     pinned: true,  color: "blue",    groupId: g2.id, eventId: null },
    { id: "n-g2-2",  title: "Sydney visit reminders",   content: "Check smoke alarms on arrival. Water the plants if staying more than 3 days. Bin day is Tuesday.",                                                    category: "Home",     pinned: false, color: "yellow",  groupId: g2.id, eventId: null },
    { id: "n-ev1-1", title: "Wedding guest list",        content: "Total: 78 guests confirmed. 12 pending RSVP. Table plan needed by May 15. Dietary: 4 vegan, 2 gluten-free.",                                         category: "General",  pinned: true,  color: "rose",    groupId: g1.id, eventId: "ev1" },
    { id: "n-ev1-2", title: "Venue requirements",        content: "Venue capacity: 100. Setup from 10am. No outside catering. In-house AV. Parking for 40 cars.",                                                       category: "General",  pinned: true,  color: "green",   groupId: g1.id, eventId: "ev1" },
    { id: "n-ev1-3", title: "Vendor contacts",           content: "Florist: Bloom & Co 0412-555-001. DJ: SoundWave Events 0421-555-002. MC: James Thompson 0433-555-003.",                                               category: "General",  pinned: false, color: "default", groupId: g1.id, eventId: "ev1" },
  ]
  for (const n of noteData) {
    await prisma.note.upsert({ where: { id: n.id }, update: {}, create: n })
  }

  // ── Calendar Events ────────────────────────────────────────────────────────
  const calendarData = [
    { id: "c1",      title: "Pay rent",                date: d("2026-04-01"), time: null,    category: "reminder",    allDay: true,  icon: "🏠", groupId: g1.id, eventId: null },
    { id: "c2",      title: "Doctor appointment",      date: d("2026-04-03"), time: "10:30", category: "appointment", allDay: false, icon: "🏥", groupId: g1.id, eventId: null },
    { id: "c3",      title: "Sarah's birthday",        date: d("2026-04-05"), time: null,    category: "birthday",    allDay: true,  icon: "🎂", groupId: g1.id, eventId: null },
    { id: "c4",      title: "Home insurance renewal",  date: d("2026-04-07"), time: null,    category: "reminder",    allDay: true,  icon: "📋", groupId: g1.id, eventId: null },
    { id: "c5",      title: "Dinner with family",      date: d("2026-04-12"), time: "19:00", category: "social",      allDay: false, icon: "🍽️", groupId: g1.id, eventId: null },
    { id: "c6",      title: "Plumber visit",           date: d("2026-04-14"), time: "09:00", category: "appointment", allDay: false, icon: "🔧", groupId: g1.id, eventId: null },
    { id: "c7",      title: "Earth Day",               date: d("2026-04-22"), time: null,    category: "holiday",     allDay: true,  icon: "🌍", groupId: g1.id, eventId: null },
    { id: "c8",      title: "Car service",             date: d("2026-04-24"), time: "11:00", category: "appointment", allDay: false, icon: "🚗", groupId: g1.id, eventId: null },
    { id: "c9",      title: "Monthly budget review",   date: d("2026-04-28"), time: "20:00", category: "reminder",    allDay: false, icon: "💰", groupId: g1.id, eventId: null },
    { id: "c10",     title: "Neighbour's housewarming", date: d("2026-04-30"), time: "18:00", category: "social",     allDay: false, icon: "🏡", groupId: g1.id, eventId: null },
    { id: "c-g2-1",  title: "Mum's birthday",          date: d("2026-04-18"), time: null,    category: "birthday",    allDay: true,  icon: "🎂", groupId: g2.id, eventId: null },
    { id: "c-g2-2",  title: "HVAC service",            date: d("2026-04-22"), time: "09:00", category: "appointment", allDay: false, icon: "🔧", groupId: g2.id, eventId: null },
    { id: "c-ev1-1", title: "Venue viewing",           date: d("2026-04-15"), time: "14:00", category: "appointment", allDay: false, icon: "🏛️", groupId: g1.id, eventId: "ev1" },
    { id: "c-ev1-2", title: "Engagement party",        date: d("2026-05-10"), time: "18:00", category: "social",      allDay: false, icon: "💍", groupId: g1.id, eventId: "ev1" },
    { id: "c-ev1-3", title: "Wedding day",             date: d("2026-09-15"), time: null,    category: "social",      allDay: true,  icon: "💒", groupId: g1.id, eventId: "ev1" },
  ]
  for (const c of calendarData) {
    await prisma.calendarEvent.upsert({ where: { id: c.id }, update: {}, create: c })
  }

  // ── Day Meals ──────────────────────────────────────────────────────────────
  // Using findFirst + upsert-by-id to handle null eventId unique constraint
  const mealPlanData = [
    { day: "Mon", breakfast: "r1", lunch: "r4", dinner: "r7",  groupId: g1.id, eventId: null },
    { day: "Tue", breakfast: "r2", lunch: "r5", dinner: "r8",  groupId: g1.id, eventId: null },
    { day: "Wed", breakfast: "r3", lunch: "r6", dinner: "r9",  groupId: g1.id, eventId: null },
    { day: "Thu", breakfast: "r1", lunch: "r4", dinner: "r10", groupId: g1.id, eventId: null },
    { day: "Fri", breakfast: "r2", lunch: "r5", dinner: "r7",  groupId: g1.id, eventId: null },
    { day: "Sat", breakfast: "r3", lunch: "",   dinner: "r8",  groupId: g1.id, eventId: null },
    { day: "Sun", breakfast: "",   lunch: "",   dinner: "r10", groupId: g1.id, eventId: null },
    { day: "Mon", breakfast: "r1", lunch: "r5", dinner: "r8",  groupId: g2.id, eventId: null },
    { day: "Tue", breakfast: "r2", lunch: "r4", dinner: "r9",  groupId: g2.id, eventId: null },
    { day: "Wed", breakfast: "r3", lunch: "r6", dinner: "r10", groupId: g2.id, eventId: null },
    { day: "Thu", breakfast: "r1", lunch: "r5", dinner: "r7",  groupId: g2.id, eventId: null },
    { day: "Fri", breakfast: "r2", lunch: "r4", dinner: "r8",  groupId: g2.id, eventId: null },
    { day: "Sat", breakfast: "r3", lunch: "",   dinner: "r10", groupId: g2.id, eventId: null },
    { day: "Sun", breakfast: "",   lunch: "",   dinner: "r9",  groupId: g2.id, eventId: null },
  ]
  for (const m of mealPlanData) {
    const existing = await prisma.dayMeals.findFirst({
      where: { groupId: m.groupId, day: m.day, eventId: m.eventId },
    })
    if (!existing) {
      await prisma.dayMeals.create({ data: m })
    }
  }

  console.log("✅ Seed complete")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
