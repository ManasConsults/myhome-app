# /fe-chart — Scaffold a new chart component

Create a new responsive chart component using Recharts. The argument format is:
`/fe-chart [ChartName] [--bar] [--line] [--donut] [--area]`

- `ChartName` — PascalCase name, e.g. `MonthlyExpenses`, `BudgetBreakdown` (required)
- One type flag is required. If none provided, default to `--bar`.

---

## All chart types share these foundations

**File location:** `components/charts/[ChartName].tsx`

**Required base structure for all types:**
```tsx
"use client"
import { ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface [ChartName]Props {
  data: [ChartName]DataPoint[]
  isLoading?: boolean
  className?: string
}

// Show skeleton while loading
if (isLoading) {
  return <Skeleton className={cn("h-64 w-full rounded-xl", className)} />
}
```

**Color palette — always use CSS variables so dark/light mode works:**
```tsx
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]
```

**Custom Tooltip pattern:**
```tsx
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}
```

**Framer Motion entrance for the chart wrapper:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
  className={cn("h-64 w-full", className)}
>
  <ResponsiveContainer width="100%" height="100%">
    {/* chart */}
  </ResponsiveContainer>
</motion.div>
```

---

## `--bar` — Bar chart

Data type:
```ts
interface [ChartName]DataPoint {
  label: string
  value: number
  [key: string]: string | number
}
```

Use `<BarChart>` with `<Bar>`, `<XAxis>`, `<YAxis>`, `<CartesianGrid>`, `<Tooltip content={<CustomTooltip />}>`, `<Legend>`.

Bar fill: `COLORS[0]`. Add `radius={[4, 4, 0, 0]}` on `<Bar>` for rounded tops.

---

## `--line` — Line chart

Data type:
```ts
interface [ChartName]DataPoint {
  date: string
  [key: string]: string | number
}
```

Use `<LineChart>` with `<Line type="monotone">`, `<XAxis>`, `<YAxis>`, `<CartesianGrid>`, `<Tooltip content={<CustomTooltip />}>`, `<Legend>`.

Add `dot={false}` and `strokeWidth={2}` on `<Line>`.

---

## `--area` — Area chart (good for spending over time)

Same as `--line` but use `<AreaChart>` + `<Area>` with:
```tsx
<defs>
  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
  </linearGradient>
</defs>
<Area fill="url(#colorValue)" stroke={COLORS[0]} strokeWidth={2} />
```

---

## `--donut` — Donut / pie chart (good for budget breakdown)

Data type:
```ts
interface [ChartName]DataPoint {
  name: string
  value: number
}
```

Use `<PieChart>` + `<Pie innerRadius="60%" outerRadius="80%">` with `<Cell>` for each segment.

Add a centered label showing total:
```tsx
<text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xl font-bold">
  {total}
</text>
```

---

## After generating

- Update barrel export at `components/charts/index.ts`
- List all created file paths and the data shape expected
