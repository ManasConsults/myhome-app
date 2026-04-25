import { defineConfig, env } from "prisma/config"
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
    url: env("DATABASE_URL"),
  },
})
