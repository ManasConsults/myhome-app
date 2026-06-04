import { defineConfig } from "prisma/config"
import { config } from "dotenv"
import { resolve } from "path"

// Prisma CLI doesn't auto-load .env before evaluating this file in v7
config({ path: resolve(process.cwd(), ".env") })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Use direct (non-pooled) URL for migrations; fall back to DATABASE_URL
    // for prisma generate in CI where no DB connection is needed.
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL) as string,
  },
})
