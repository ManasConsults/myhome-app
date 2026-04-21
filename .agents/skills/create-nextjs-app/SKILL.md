---
name: create-nextjs-app
description: Scaffolds a production-grade Next.js application with Tailwind v4, shadcn/ui, Prisma, Auth.js v5 (NextAuth), ESLint, and Prettier. Use when the user asks to create, bootstrap, or scaffold a new Next.js project with a full production stack.
user-invocable: true
allowed-tools: Bash(npx *), Bash(pnpm *), Bash(npm *), Bash(bunx *), Bash(mkdir *), Bash(cp *), Bash(touch *)
---

# Create Production-Grade Next.js App

Scaffold a complete, production-ready Next.js application. The user provides an app name and optional description. Ask for anything unclear before proceeding.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router, RSC-first) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Database ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) |
| Linting | ESLint (Next.js config) + Prettier |
| Language | TypeScript (strict) |

---

## Phase 1 — Bootstrap

```bash
# Detect package manager from context (prefer pnpm if available)
pnpm create next-app@latest <app-name> \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack  # remove if user wants Turbopack
```

Confirm the scaffolded structure before proceeding.

---

## Phase 2 — Typography

Choose a font that is modern, purposeful, and not generic. Avoid Inter, Arial, system-ui, and overused choices like Space Grotesk. Default recommendation: **Plus Jakarta Sans** — geometric, clean, excellent at UI scales. Adjust per project aesthetic.

```bash
# No extra install needed — next/font/google handles it
```

**`src/app/layout.tsx`**
```tsx
import { Plus_Jakarta_Sans } from "next/font/google"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body className="min-h-screen bg-background antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
```

In `globals.css`, wire the variable in `@theme`:
```css
@theme {
  --font-sans: var(--font-sans); /* picks up the CSS var from layout */
}
```

**Font selection guide:**

| Aesthetic | Font |
|---|---|
| Clean dashboard / SaaS | Plus Jakarta Sans, Outfit, Figtree |
| Editorial / content | Instrument Serif + Instrument Sans |
| Technical / developer tool | JetBrains Mono, IBM Plex Mono |
| Friendly / consumer | Nunito, Rethink Sans |
| Refined / luxury | Cormorant Garamond + DM Sans |

> Always specify `weight` for non-variable fonts, or omit it for variable fonts to load all weights. Always set `subsets: ["latin"]`.

---

## Phase 3 — Tailwind v4

Tailwind v4 ships with `@tailwindcss/vite` or `@tailwindcss/postcss`. Next.js uses PostCSS.

```bash
pnpm add tailwindcss@next @tailwindcss/postcss autoprefixer
```

**`postcss.config.mjs`**
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**`src/app/globals.css`** — replace content:
```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-sans); /* set in layout.tsx via next/font */
  --font-mono: var(--font-mono);

  /* Brand colors — update per project */
  --color-primary: oklch(55% 0.22 250);
  --color-primary-foreground: oklch(98% 0 0);
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(15% 0 0);
  --color-muted: oklch(96% 0 0);
  --color-muted-foreground: oklch(45% 0 0);
  --color-border: oklch(90% 0 0);
  --color-destructive: oklch(55% 0.22 25);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

Add `cn` utility:
**`src/lib/utils.ts`**
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```bash
pnpm add clsx tailwind-merge
```

---

## Phase 4 — shadcn/ui

```bash
pnpm dlx shadcn@latest init --defaults
```

When prompted, choose:
- Style: **New York** (or per user preference)
- Base color: **Neutral**
- CSS variables: **Yes**

Add a sensible default component set:
```bash
pnpm dlx shadcn@latest add button card input label \
  form select textarea dialog sheet \
  dropdown-menu avatar badge separator \
  skeleton toast sonner
```

> Always check `components.json` is correct before adding more components.

---

## Phase 5 — Prisma

```bash
pnpm add prisma @prisma/client
pnpm dlx prisma init --datasource-provider postgresql
```

**`prisma/schema.prisma`** — starter schema:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models below. Example:
// model User {
//   id        String   @id @default(cuid())
//   email     String   @unique
//   name      String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
```

**`src/lib/db.ts`** — singleton client:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

Add `DATABASE_URL` to `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

---

## Phase 6 — Auth.js v5 (NextAuth)

```bash
pnpm add next-auth@beta
```

**`src/auth.ts`** — central config (co-located with `src/app/`):
```ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
// import Google from "next-auth/providers/google";
// import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub,
    // Google,
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/dashboard");
      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

**`src/app/api/auth/[...nextauth]/route.ts`**
```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

**`proxy.ts`** (project root) — protect routes (Next.js 16, replaces `middleware.ts`):
```ts
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

**`src/lib/auth.ts`** — typed session helper for Server Components:
```ts
import { auth } from "@/auth";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});
```

**Usage in Server Components:**
```tsx
import { getCurrentUser } from "@/lib/auth";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div>Hello {user.name}</div>;
}
```

**Usage in Client Components** — wrap layout with `SessionProvider`:

**`src/app/layout.tsx`**
```tsx
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

```tsx
// Client component
"use client";
import { useSession } from "next-auth/react";

export function UserAvatar() {
  const { data: session } = useSession();
  return <span>{session?.user?.name}</span>;
}
```

**Sign in / sign out Server Actions:**
```tsx
import { signIn, signOut } from "@/auth";

// Sign in button
<form action={async () => { "use server"; await signIn("github"); }}>
  <button type="submit">Sign in with GitHub</button>
</form>

// Sign out button
<form action={async () => { "use server"; await signOut(); }}>
  <button type="submit">Sign out</button>
</form>
```

Add to `.env.local`:
```
AUTH_SECRET=""           # openssl rand -hex 32
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
# AUTH_GOOGLE_ID=""
# AUTH_GOOGLE_SECRET=""
```

> **Prisma Adapter** — if storing sessions in the database, add:
> ```bash
> pnpm add @auth/prisma-adapter
> ```
> ```ts
> import { PrismaAdapter } from "@auth/prisma-adapter";
> import { db } from "@/lib/db";
>
> export const { handlers, auth, signIn, signOut } = NextAuth({
>   adapter: PrismaAdapter(db),
>   // ...
> });
> ```
> Then add the Auth.js Prisma schema models (`Account`, `Session`, `User`, `VerificationToken`) — run `pnpm dlx @auth/prisma-adapter` to get the schema snippet.

---

## Phase 7 — ESLint + Prettier

ESLint is already configured by `create-next-app`. Extend it:

**`eslint.config.mjs`**
```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
```

```bash
pnpm add -D prettier prettier-plugin-tailwindcss eslint-config-prettier
```

**`.prettierrc`**
```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**`.prettierignore`**
```
.next
node_modules
prisma/migrations
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

---

## Phase 8 — Project Structure

Final directory layout:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── logout/page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   └── auth/[auth0]/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components (auto-generated)
│   └── <feature>/        # feature-scoped components
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   └── utils.ts
├── actions/              # Server Actions (mutations)
└── proxy.ts              # Route protection (Next.js 16)
prisma/
└── schema.prisma
```

---

## Phase 9 — Environment Variables Template

Create `.env.example` (commit this, not `.env.local`):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Auth.js
AUTH_SECRET=""           # openssl rand -hex 32
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
# AUTH_GOOGLE_ID=""
# AUTH_GOOGLE_SECRET=""
```

Add `.env.local` to `.gitignore` (already included by `create-next-app`).

---

## Phase 10 — Theme Color Customization (Optional)

Allow users to choose their own accent/primary color. Colors are stored in `localStorage` and applied by updating CSS variables on `document.documentElement` at runtime — no server round-trip needed.

### Files

**`lib/theme-colors.ts`** — presets (hue-based, oklch):
```ts
export interface ThemeColor {
  id: string
  name: string
  h: number  // oklch hue — only the hue changes, L and C stay consistent
}

export const THEME_COLORS: ThemeColor[] = [
  { id: "indigo",  name: "Indigo",  h: 264 },
  { id: "blue",    name: "Blue",    h: 220 },
  { id: "violet",  name: "Violet",  h: 290 },
  { id: "rose",    name: "Rose",    h: 10  },
  { id: "orange",  name: "Orange",  h: 30  },
  { id: "amber",   name: "Amber",   h: 65  },
  { id: "emerald", name: "Emerald", h: 155 },
  { id: "teal",    name: "Teal",    h: 195 },
]

export const DEFAULT_COLOR_ID = "indigo"

export function applyThemeColor(color: ThemeColor, isDark: boolean) {
  const root = document.documentElement
  const { h } = color
  if (isDark) {
    root.style.setProperty("--primary", `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--ring",    `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--sidebar-primary", `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--sidebar-ring",    `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--chart-1", `oklch(0.65 0.20 ${h})`)
  } else {
    root.style.setProperty("--primary", `oklch(0.52 0.22 ${h})`)
    root.style.setProperty("--ring",    `oklch(0.52 0.22 ${h})`)
    root.style.setProperty("--sidebar-primary", `oklch(0.65 0.18 ${h})`)
    root.style.setProperty("--sidebar-ring",    `oklch(0.52 0.22 ${h})`)
    root.style.setProperty("--chart-1", `oklch(0.52 0.22 ${h})`)
  }
}

export function getPreviewColor(color: ThemeColor): string {
  return `oklch(0.55 0.22 ${color.h})`
}
```

**`components/providers/ThemeColorProvider.tsx`** — context + localStorage + theme sync:
```tsx
"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { THEME_COLORS, DEFAULT_COLOR_ID, type ThemeColor, applyThemeColor } from "@/lib/theme-colors"

const STORAGE_KEY = "app-color"

interface ThemeColorContext { activeColor: ThemeColor; setActiveColor: (c: ThemeColor) => void }
const Ctx = createContext<ThemeColorContext | null>(null)

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [activeColor, setActive] = useState<ThemeColor>(
    () => THEME_COLORS.find(c => c.id === DEFAULT_COLOR_ID)!
  )

  // Read localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const found = THEME_COLORS.find(c => c.id === stored)
    if (found) setActive(found)
  }, [])

  // Re-apply whenever color or light/dark changes
  useEffect(() => {
    if (resolvedTheme) applyThemeColor(activeColor, resolvedTheme === "dark")
  }, [activeColor, resolvedTheme])

  function setActiveColor(color: ThemeColor) {
    setActive(color)
    localStorage.setItem(STORAGE_KEY, color.id)
    applyThemeColor(color, resolvedTheme === "dark")
  }

  return <Ctx.Provider value={{ activeColor, setActiveColor }}>{children}</Ctx.Provider>
}

export const useThemeColor = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useThemeColor must be used inside ThemeColorProvider")
  return ctx
}
```

**Nest inside `ThemeProvider` in `app/layout.tsx`:**
```tsx
<ThemeProvider>
  <ThemeColorProvider>{children}</ThemeColorProvider>
</ThemeProvider>
```

**`components/settings/ColorPicker.tsx`** — swatch UI:
```tsx
"use client"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { THEME_COLORS, getPreviewColor } from "@/lib/theme-colors"
import { useThemeColor } from "@/components/providers/ThemeColorProvider"

export function ColorPicker() {
  const { activeColor, setActiveColor } = useThemeColor()
  return (
    <div className="flex flex-wrap gap-2.5">
      {THEME_COLORS.map((color) => (
        <button
          key={color.id}
          onClick={() => setActiveColor(color)}
          title={color.name}
          aria-label={color.name}
          className="relative size-9 rounded-full transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{ backgroundColor: getPreviewColor(color) }}
        >
          {activeColor.id === color.id && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="size-4 text-white drop-shadow" />
            </motion.span>
          )}
        </button>
      ))}
    </div>
  )
}
```

**Render in Settings page** inside an Appearance card:
```tsx
import { Palette } from "lucide-react"
import { ColorPicker } from "@/components/settings/ColorPicker"

<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Palette className="size-4 text-muted-foreground" /> Appearance
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm font-medium mb-1">Accent color</p>
    <p className="text-xs text-muted-foreground mb-3">Applies instantly across the entire app</p>
    <ColorPicker />
  </CardContent>
</Card>
```

### Key patterns
- Only hue varies; lightness and chroma are fixed per mode — guarantees accessible contrast at every color
- `resolvedTheme` (not `theme`) is used to handle the `"system"` theme case
- `ThemeColorProvider` must be a child of `ThemeProvider` (needs `useTheme`)
- CSS variables are set inline on `documentElement` — overrides the stylesheet defaults without touching the CSS file

---

## Phase 11 — Final Checks

Run these before declaring the scaffold complete:

```bash
pnpm typecheck        # TypeScript — must pass clean
pnpm lint             # ESLint — must pass clean
pnpm format:check     # Prettier — must pass clean
pnpm db:generate      # Generate Prisma client
pnpm dev              # Verify app boots at localhost:3000
```

Fix all errors before handing off.

---

## Conventions (enforce throughout)

- **No `any`** — TypeScript strict mode is on
- **RSC by default** — only add `"use client"` when hooks, events, or browser APIs are needed
- **Server Actions for mutations** — return `{ success: boolean; data?: T; error?: string }`
- **Zod for all validation** — forms and server actions share schemas from `src/lib/validations/`
- **Semantic Tailwind tokens** — `bg-background`, `text-muted-foreground`, never raw colors
- **`cn()` for conditional classes** — never manual template literal ternaries
- **Lucide React for icons** — exclusively, unless shadcn project context says otherwise
- **Touch targets ≥ 44px** on mobile
- **All states handled** — loading, empty, error, populated. Never leave as TODO
