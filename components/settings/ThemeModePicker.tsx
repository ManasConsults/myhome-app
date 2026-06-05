"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

const MODES = [
  { id: "light",  label: "Light",  Icon: Sun },
  { id: "dark",   label: "Dark",   Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
] as const

export function ThemeModePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="grid grid-cols-3 gap-2">
      {MODES.map(({ id, label, Icon }) => {
        const isActive = theme === id
        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            aria-label={`Switch to ${label} mode`}
            className={cn(
              "flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all duration-150",
              "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
