"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { THEME_COLORS, getPreviewColor } from "@/lib/theme-colors"
import { useThemeColor } from "@/components/providers/ThemeColorProvider"

export function ColorPicker() {
  const { activeColor, setActiveColor } = useThemeColor()

  return (
    <div className="flex flex-wrap gap-2.5">
      {THEME_COLORS.map((color) => {
        const isActive = activeColor.id === color.id

        return (
          <button
            key={color.id}
            onClick={() => setActiveColor(color)}
            title={color.name}
            aria-label={`${color.name} theme color${isActive ? " (active)" : ""}`}
            className="relative size-9 rounded-full transition-transform duration-150 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ backgroundColor: getPreviewColor(color) }}
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
          </button>
        )
      })}
    </div>
  )
}
