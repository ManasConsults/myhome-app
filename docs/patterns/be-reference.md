# Backend Reference Patterns

Reference implementations for common backend patterns. Used by the `/be` skill when no conventions exist yet.

---

## Drizzle Schema

```ts
// lib/db/schema/transactions.ts
import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

export const transactions = pgTable("transactions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount:    integer("amount").notNull(), // store in cents
  category:  text("category").notNull(),
  note:      text("note"),
  date:      timestamp("date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Transaction       = typeof transactions.$inferSelect
export type NewTransaction    = typeof transactions.$inferInsert
```

---

## Zod Validation Schema

```ts
// lib/validations/transaction.ts
import { z } from "zod"

export const createTransactionSchema = z.object({
  amount:   z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  note:     z.string().optional(),
  date:     z.coerce.date(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
```

---

## Server Action

```ts
// lib/actions/transactions.ts
"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema/transactions"
import { createTransactionSchema, type CreateTransactionInput } from "@/lib/validations/transaction"

export async function createTransaction(input: CreateTransactionInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorised" }

  const parsed = createTransactionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid input" }

  try {
    const [row] = await db
      .insert(transactions)
      .values({ ...parsed.data, userId: session.user.id })
      .returning()
    return { success: true, data: row }
  } catch {
    return { success: false, error: "Failed to create transaction" }
  }
}
```

---

## API Route Handler

```ts
// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema/transactions"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, session.user.id))
    .orderBy(transactions.date)

  return NextResponse.json({ data: rows })
}
```

---

## Migration workflow

```bash
# 1. Generate migration after schema changes
npx drizzle-kit generate

# 2. Review the generated SQL in drizzle/migrations/

# 3. Apply to local DB
npx drizzle-kit migrate

# 4. Apply to production (via Vercel env)
DATABASE_URL=<prod-url> npx drizzle-kit migrate
```
