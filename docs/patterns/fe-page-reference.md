# /fe-page — Scaffold a new App Router page

Create a new Next.js App Router page at the path provided as the argument (e.g. `/fe-page dashboard/finance`).

## Steps

1. **Parse the argument** as the route segment path (e.g. `dashboard/finance` → `app/(dashboard)/finance/`).

2. **Create `app/(dashboard)/[path]/page.tsx`** with:
   - A named export `export default function [Name]Page()`
   - `export const metadata: Metadata` with a sensible `title` and `description`
   - The page wrapped in a `<motion.div>` using the `pageVariants` pattern below
   - A responsive `<section>` shell with mobile-first Tailwind layout classes
   - A `<h1>` heading using the page name

3. **Create `app/(dashboard)/[path]/loading.tsx`** with:
   - A skeleton loader using `animate-pulse` divs that matches the expected page shape
   - Same outer layout classes as the page so there is no layout shift

4. **Create `app/(dashboard)/[path]/error.tsx`** with:
   - `"use client"` directive
   - Props: `{ error: Error & { digest?: string }; reset: () => void }`
   - A centered error message card with a "Try again" button that calls `reset()`

5. **Use these exact Framer Motion page transition patterns:**

```tsx
// variants — define once per page, outside the component
const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// inside the component
<motion.div
  variants={pageVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  className="flex flex-col gap-6 p-4 md:p-8"
>
  {/* page content */}
</motion.div>
```

6. **Responsive shell classes to use on the inner `<section>`:**
   - `className="mx-auto w-full max-w-5xl"`

7. **Imports to include:**
```tsx
import type { Metadata } from "next"
import { motion } from "framer-motion"
```

## Output summary

After creating the files, list all created file paths and briefly describe each one.
