"use server"

import { prisma } from "@/lib/db/prisma"
import { toDateStr } from "@/lib/utils"
import type { Budget, Expense, Income, Loan, LoanAdvance, LoanRepayment } from "@/lib/types"
import { requireGroupOwner } from "./_auth-guard"

// ─── Budget ─────────────────────────────────────────────────────────────────

function serializeBudget(b: Awaited<ReturnType<typeof prisma.budget.findFirst>>): Budget {
  if (!b) throw new Error("Budget not found")
  return {
    id: b.id,
    name: b.name,
    type: b.type as Budget["type"],
    category: b.category,
    icon: b.icon,
    color: b.color,
    amount: b.amount,
    spent: b.spent,
    startDate: toDateStr(b.startDate),
    period: b.period,
    groupId: b.groupId,
    eventId: b.eventId ?? undefined,
    createdAt: toDateStr(b.createdAt),
    updatedAt: toDateStr(b.updatedAt),
  }
}

export async function getBudgets(groupId: string, eventId?: string): Promise<Budget[]> {
  await requireGroupOwner(groupId)
  const items = await prisma.budget.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { updatedAt: "desc" },
  })
  return items.map(serializeBudget)
}

export async function createBudget(
  data: Omit<Budget, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Budget } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    const b = await prisma.budget.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        icon: data.icon,
        color: data.color,
        amount: data.amount,
        spent: data.spent,
        startDate: new Date(data.startDate),
        period: data.period,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeBudget(b) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateBudget(
  id: string,
  data: Partial<Omit<Budget, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Budget } | { success: false; error: string }> {
  try {
    const existing = await prisma.budget.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const b = await prisma.budget.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeBudget(b) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteBudget(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.budget.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false }
    await requireGroupOwner(existing.groupId)
    await prisma.budget.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}

// ─── Expense ─────────────────────────────────────────────────────────────────

function serializeExpense(e: Awaited<ReturnType<typeof prisma.expense.findFirst>>): Expense {
  if (!e) throw new Error("Expense not found")
  return {
    id: e.id,
    title: e.title,
    amount: e.amount,
    category: e.category,
    icon: e.icon,
    date: toDateStr(e.date),
    recurring: e.recurring,
    frequency: e.frequency as Expense["frequency"] ?? undefined,
    nextDate: e.nextDate ? toDateStr(e.nextDate) : undefined,
    budgetId: e.budgetId ?? undefined,
    groupId: e.groupId,
    eventId: e.eventId ?? undefined,
    createdAt: toDateStr(e.createdAt),
    updatedAt: toDateStr(e.updatedAt),
  }
}

export async function getExpenses(groupId: string, eventId?: string): Promise<Expense[]> {
  await requireGroupOwner(groupId)
  const items = await prisma.expense.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { date: "desc" },
  })
  return items.map(serializeExpense)
}

export async function createExpense(
  data: Omit<Expense, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Expense } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    const e = await prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
        icon: data.icon,
        date: new Date(data.date),
        recurring: data.recurring,
        frequency: data.frequency ?? null,
        nextDate: data.nextDate ? new Date(data.nextDate) : null,
        budgetId: data.budgetId ?? null,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeExpense(e) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Expense } | { success: false; error: string }> {
  try {
    const existing = await prisma.expense.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const e = await prisma.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        nextDate: data.nextDate ? new Date(data.nextDate) : data.nextDate === null ? null : undefined,
        frequency: data.frequency ?? null,
        budgetId: data.budgetId ?? null,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeExpense(e) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteExpense(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.expense.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false }
    await requireGroupOwner(existing.groupId)
    await prisma.expense.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}

// ─── Income ──────────────────────────────────────────────────────────────────

function serializeIncome(i: Awaited<ReturnType<typeof prisma.income.findFirst>>): Income {
  if (!i) throw new Error("Income not found")
  return {
    id: i.id,
    title: i.title,
    amount: i.amount,
    category: i.category,
    icon: i.icon,
    date: toDateStr(i.date),
    recurring: i.recurring,
    frequency: i.frequency as Income["frequency"] ?? undefined,
    nextDate: i.nextDate ? toDateStr(i.nextDate) : undefined,
    groupId: i.groupId,
    eventId: i.eventId ?? undefined,
    createdAt: toDateStr(i.createdAt),
    updatedAt: toDateStr(i.updatedAt),
  }
}

export async function getIncomes(groupId: string, eventId?: string): Promise<Income[]> {
  await requireGroupOwner(groupId)
  const items = await prisma.income.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { date: "desc" },
  })
  return items.map(serializeIncome)
}

export async function createIncome(
  data: Omit<Income, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Income } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    const i = await prisma.income.create({
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
        icon: data.icon,
        date: new Date(data.date),
        recurring: data.recurring,
        frequency: data.frequency ?? null,
        nextDate: data.nextDate ? new Date(data.nextDate) : null,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeIncome(i) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateIncome(
  id: string,
  data: Partial<Omit<Income, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Income } | { success: false; error: string }> {
  try {
    const existing = await prisma.income.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const i = await prisma.income.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        nextDate: data.nextDate ? new Date(data.nextDate) : data.nextDate === null ? null : undefined,
        frequency: data.frequency ?? null,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeIncome(i) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteIncome(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.income.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false }
    await requireGroupOwner(existing.groupId)
    await prisma.income.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}

// ─── Loan ────────────────────────────────────────────────────────────────────

function serializeLoan(l: Awaited<ReturnType<typeof prisma.loan.findFirst>>): Loan {
  if (!l) throw new Error("Loan not found")
  return {
    id: l.id,
    direction: l.direction as Loan["direction"],
    contact: l.contact,
    principal: l.principal,
    interestRate: l.interestRate,
    startDate: toDateStr(l.startDate),
    dueDate: l.dueDate ? toDateStr(l.dueDate) : undefined,
    notes: l.notes ?? undefined,
    groupId: l.groupId,
    eventId: l.eventId ?? undefined,
    createdAt: toDateStr(l.createdAt),
    updatedAt: toDateStr(l.updatedAt),
  }
}

export async function getLoans(groupId: string, eventId?: string): Promise<Loan[]> {
  await requireGroupOwner(groupId)
  const items = await prisma.loan.findMany({
    where: eventId ? { eventId } : { groupId },
    orderBy: { startDate: "desc" },
  })
  return items.map(serializeLoan)
}

export async function createLoan(
  data: Omit<Loan, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: Loan } | { success: false; error: string }> {
  try {
    await requireGroupOwner(data.groupId)
    const l = await prisma.loan.create({
      data: {
        direction: data.direction,
        contact: data.contact,
        principal: data.principal,
        interestRate: data.interestRate,
        startDate: new Date(data.startDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes ?? null,
        groupId: data.groupId,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeLoan(l) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateLoan(
  id: string,
  data: Partial<Omit<Loan, "id" | "createdAt" | "updatedAt">>,
): Promise<{ success: true; data: Loan } | { success: false; error: string }> {
  try {
    const existing = await prisma.loan.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false, error: "Not found" }
    await requireGroupOwner(existing.groupId)
    const l = await prisma.loan.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
        notes: data.notes ?? null,
        eventId: data.eventId ?? null,
      },
    })
    return { success: true, data: serializeLoan(l) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteLoan(id: string): Promise<{ success: boolean }> {
  try {
    const existing = await prisma.loan.findUnique({ where: { id }, select: { groupId: true } })
    if (!existing) return { success: false }
    await requireGroupOwner(existing.groupId)
    await prisma.loan.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}

// ─── LoanRepayment ───────────────────────────────────────────────────────────

function serializeRepayment(r: Awaited<ReturnType<typeof prisma.loanRepayment.findFirst>>): LoanRepayment {
  if (!r) throw new Error("LoanRepayment not found")
  return {
    id: r.id,
    loanId: r.loanId,
    amount: r.amount,
    date: toDateStr(r.date),
    note: r.note ?? undefined,
    createdAt: toDateStr(r.createdAt),
    updatedAt: toDateStr(r.updatedAt),
  }
}

export async function getRepayments(loanId: string): Promise<LoanRepayment[]> {
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, select: { groupId: true } })
  if (!loan) return []
  await requireGroupOwner(loan.groupId)
  const items = await prisma.loanRepayment.findMany({
    where: { loanId },
    orderBy: { date: "asc" },
  })
  return items.map(serializeRepayment)
}

export async function getRepaymentsByGroup(groupId: string): Promise<LoanRepayment[]> {
  await requireGroupOwner(groupId)
  const loans = await prisma.loan.findMany({ where: { groupId }, select: { id: true } })
  const loanIds = loans.map((l) => l.id)
  const items = await prisma.loanRepayment.findMany({
    where: { loanId: { in: loanIds } },
    orderBy: { date: "asc" },
  })
  return items.map(serializeRepayment)
}

export async function createRepayment(
  data: Omit<LoanRepayment, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: LoanRepayment } | { success: false; error: string }> {
  try {
    const loan = await prisma.loan.findUnique({ where: { id: data.loanId }, select: { groupId: true } })
    if (!loan) return { success: false, error: "Loan not found" }
    await requireGroupOwner(loan.groupId)
    const r = await prisma.loanRepayment.create({
      data: {
        loanId: data.loanId,
        amount: data.amount,
        date: new Date(data.date),
        note: data.note ?? null,
      },
    })
    return { success: true, data: serializeRepayment(r) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteRepayment(id: string): Promise<{ success: boolean }> {
  try {
    const repayment = await prisma.loanRepayment.findUnique({ where: { id }, select: { loanId: true } })
    if (!repayment) return { success: false }
    const loan = await prisma.loan.findUnique({ where: { id: repayment.loanId }, select: { groupId: true } })
    if (!loan) return { success: false }
    await requireGroupOwner(loan.groupId)
    await prisma.loanRepayment.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false }
  }
}

// ─── LoanAdvance ─────────────────────────────────────────────────────────────

function serializeAdvance(a: Awaited<ReturnType<typeof prisma.loanAdvance.findFirst>>): LoanAdvance {
  if (!a) throw new Error("LoanAdvance not found")
  return {
    id: a.id,
    loanId: a.loanId,
    amount: a.amount,
    date: toDateStr(a.date),
    note: a.note ?? undefined,
    createdAt: toDateStr(a.createdAt),
    updatedAt: toDateStr(a.updatedAt),
  }
}

export async function getAdvancesByGroup(groupId: string): Promise<LoanAdvance[]> {
  await requireGroupOwner(groupId)
  const loans = await prisma.loan.findMany({ where: { groupId }, select: { id: true } })
  const loanIds = loans.map((l) => l.id)
  const items = await prisma.loanAdvance.findMany({
    where: { loanId: { in: loanIds } },
    orderBy: { date: "asc" },
  })
  return items.map(serializeAdvance)
}

export async function createAdvance(
  data: Omit<LoanAdvance, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: true; data: LoanAdvance } | { success: false; error: string }> {
  try {
    const loan = await prisma.loan.findUnique({ where: { id: data.loanId }, select: { groupId: true } })
    if (!loan) return { success: false, error: "Loan not found" }
    await requireGroupOwner(loan.groupId)
    const a = await prisma.loanAdvance.create({
      data: {
        loanId: data.loanId,
        amount: data.amount,
        date: new Date(data.date),
        note: data.note ?? null,
      },
    })
    return { success: true, data: serializeAdvance(a) }
  } catch (e) {
    if (e instanceof Error && (e.message === "Unauthenticated" || e.message === "Forbidden")) throw e
    return { success: false, error: "Something went wrong" }
  }
}
