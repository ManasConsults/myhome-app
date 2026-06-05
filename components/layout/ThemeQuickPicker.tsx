"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { THEME_COLORS, getPreviewColor } from "@/lib/theme-colors"
import { useThemeColor } from "@/components/providers/ThemeColorProvider"

const MODES = [
  { id: "light",  label: "Light",  Icon: Sun },
  { id: "dark",   label: "Dark",   Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
] as const

export function ThemeQuickPicker() {
  const { theme, setTheme } = useTheme()
  const { activeColor, setActiveColor } = useThemeColor()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme settings"
        className="text-muted-foreground hover:text-foreground relative"
      >
        <Palette />
        {/* Active color dot */}
        <span
          className="absolute bottom-1.5 right-1.5 size-2 rounded-full ring-1 ring-background pointer-events-none"
          style={{ backgroundColor: getPreviewColor(activeColor) }}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border/60 bg-card p-3 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.25)]"
          >
            {/* Mode */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mode</p>
            <div className="flex gap-1.5">
              {MODES.map(({ id, label, Icon }) => {
                const isActive = theme === id
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    aria-label={`Switch to ${label} mode`}
                    title={label}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                      isActive
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span className="font-medium">{label}</span>
                  </button>
                )
              })}
            </div>

            <Separator className="my-3" />

            {/* Color */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((color) => {
                const isActive = activeColor.id === color.id
                return (
                  <button
                    key={color.id}
                    onClick={() => setActiveColor(color)}
                    aria-label={`${color.name} theme color${isActive ? " (active)" : ""}`}
                    title={color.name}
                    className={cn(
                      "relative size-7 rounded-full transition-all duration-150",
                      "hover:scale-110 active:scale-95",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                      "ring-2 ring-offset-1 ring-offset-background",
                      isActive ? "ring-current scale-110" : "ring-transparent"
                    )}
                    style={{ backgroundColor: getPreviewColor(color), color: getPreviewColor(color) }}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="size-3 text-white drop-shadow-sm" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
