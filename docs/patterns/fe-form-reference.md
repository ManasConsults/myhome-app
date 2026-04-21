# /fe-form — Scaffold a new form component

Create a new form component wired to React Hook Form + Zod. The argument format is:
`/fe-form [FormName] [--action ActionName]`

- `FormName` — PascalCase name, e.g. `AddTransaction`, `CreateTask` (required)
- `--action ActionName` — the server action this form submits to (optional, creates a stub if not found)

## Steps

1. **Create `lib/validations/[formName].ts`** with:
   - A Zod schema named `[formName]Schema`
   - Placeholder fields appropriate to the form name (infer from context — e.g. `AddTransaction` gets `amount`, `category`, `date`, `note`)
   - An exported TypeScript type: `export type [FormName]Input = z.infer<typeof [formName]Schema>`

2. **Create `components/forms/[FormName]Form.tsx`** with:
   - `"use client"` directive
   - `useForm<[FormName]Input>` from `react-hook-form` with `zodResolver`
   - shadcn/ui form primitives: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
   - One `FormField` per schema field using the appropriate shadcn/ui input component (`Input`, `Select`, `Textarea`, `DatePicker`, `Checkbox`)
   - A submit `<Button>` that shows a spinner (`Loader2` from lucide-react) while submitting
   - Three visual states: idle, submitting, error — handled via `form.formState`
   - On success: call an `onSuccess?: () => void` prop (e.g. to close a dialog)

3. **Framer Motion entrance animation on the form:**
```tsx
<motion.form
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  onSubmit={form.handleSubmit(onSubmit)}
  className="space-y-4"
>
```

4. **The `onSubmit` handler pattern:**
```tsx
async function onSubmit(values: [FormName]Input) {
  const result = await [actionName](values)
  if (!result.success) {
    form.setError("root", { message: result.error ?? "Something went wrong" })
    return
  }
  onSuccess?.()
}
```

5. **If `--action` is provided** and the action file doesn't exist at `lib/actions/[actionName].ts`, create a stub:
```ts
"use server"
import { [formName]Schema, type [FormName]Input } from "@/lib/validations/[formName]"

export async function [actionName](input: [FormName]Input) {
  const parsed = [formName]Schema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid input" }
  // TODO: implement
  return { success: true, data: null }
}
```

6. **Imports to include:**
```tsx
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { [formName]Schema, type [FormName]Input } from "@/lib/validations/[formName]"
```

## Output summary

After creating all files, list each path and describe what was generated.
