"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { THEME_COLORS, getPreviewColor } from "@/lib/theme-colors"
import { useThemeColor } from "@/components/providers/ThemeColorProvider"
import { cn } from "@/lib/utils"

export function ColorPicker() {
  const { activeColor, setActiveColor } = useThemeColor()

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-x-2 gap-y-3">
      {THEME_COLORS.map((color) => {
        const isActive = activeColor.id === color.id

        return (
          <button
            key={color.id}
            onClick={() => setActiveColor(color)}
            aria-label={`${color.name} theme color${isActive ? " (active)" : ""}`}
            className="flex flex-col items-center gap-1.5 group focus-visible:outline-none"
          >
            <span
              className={cn(
                "relative size-10 rounded-full transition-all duration-150",
                "group-hover:scale-110 group-active:scale-95",
                "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
                "ring-2 ring-offset-2 ring-offset-background",
                isActive ? "ring-current scale-110" : "ring-transparent"
              )}
              style={{ backgroundColor: getPreviewColor(color), color: getPreviewColor(color) }}
            >
              {isActive && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check className="size-4 text-white drop-shadow-sm" strokeWidth={2.5} />
                </motion.span>
              )}
            </span>
            <span className={cn(
              "text-[10px] font-medium transition-colors leading-none",
              isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {color.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
