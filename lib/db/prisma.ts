import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

// Prevent new instances on every hot-reload in dev
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
