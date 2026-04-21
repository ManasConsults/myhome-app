# /fe-component — Scaffold a new UI component

Create a new reusable UI component. The argument format is:
`/fe-component [ComponentName] [--motion] [--shadcn]`

- `ComponentName` — PascalCase name (required)
- `--motion` — include Framer Motion animation variants
- `--shadcn` — use shadcn/ui primitives (Card, Button, etc.) as the base

## Steps

1. **Determine the output path:**
   - Place the file at `components/ui/[ComponentName].tsx`
   - If the name implies a feature domain (e.g. `TransactionCard`, `TaskItem`) place it at `components/[domain]/[ComponentName].tsx`

2. **Create the component file** with:
   - `"use client"` directive if it uses hooks or motion
   - A TypeScript `interface [ComponentName]Props` with sensible placeholder props
   - A named `export function [ComponentName](props: [ComponentName]Props)`
   - Mobile-first Tailwind classes (start with base/mobile styles, layer `md:` and `lg:` breakpoints)
   - Accessible markup: correct semantic HTML element, `aria-` attributes where relevant

3. **If `--motion` flag is present**, add:
```tsx
const variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
}

// Wrap root element with <motion.div variants={variants} initial="hidden" animate="visible">
```

4. **If `--shadcn` flag is present**, import and use shadcn/ui primitives:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// etc. — only import what is actually used
```

5. **Update the barrel export** at `components/index.ts` (create it if it doesn't exist):
```ts
export { ComponentName } from "./[domain]/ComponentName"
```

6. **Imports to include as needed:**
```tsx
import { motion } from "framer-motion"
import { cn } from "@/lib/utils" // for conditional class merging
```

## Output summary

After creating the files, list all created/modified file paths and describe each change.
