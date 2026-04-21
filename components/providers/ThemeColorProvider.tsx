"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  THEME_COLORS,
  DEFAULT_COLOR_ID,
  type ThemeColor,
  applyThemeColor,
} from "@/lib/theme-colors"

const STORAGE_KEY = "myhome-color"

interface ThemeColorContextValue {
  activeColor: ThemeColor
  setActiveColor: (color: ThemeColor) => void
}

const ThemeColorContext = createContext<ThemeColorContextValue | null>(null)

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [activeColor, setActive] = useState<ThemeColor>(
    () => THEME_COLORS.find((c) => c.id === DEFAULT_COLOR_ID)!
  )

  // Read persisted color from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const found = THEME_COLORS.find((c) => c.id === stored)
    if (found) setActive(found)
  }, [])

  // Re-apply CSS vars whenever color or light/dark mode changes
  useEffect(() => {
    if (resolvedTheme) {
      applyThemeColor(activeColor, resolvedTheme === "dark")
    }
  }, [activeColor, resolvedTheme])

  function setActiveColor(color: ThemeColor) {
    setActive(color)
    localStorage.setItem(STORAGE_KEY, color.id)
    applyThemeColor(color, resolvedTheme === "dark")
  }

  return (
    <ThemeColorContext.Provider value={{ activeColor, setActiveColor }}>
      {children}
    </ThemeColorContext.Provider>
  )
}

export function useThemeColor(): ThemeColorContextValue {
  const ctx = useContext(ThemeColorContext)
  if (!ctx) throw new Error("useThemeColor must be used inside ThemeColorProvider")
  return ctx
}
