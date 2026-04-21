export interface ThemeColor {
  id: string
  name: string
  h: number // oklch hue — only the hue changes, L and C stay consistent across all presets
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

export function applyThemeColor(color: ThemeColor, isDark: boolean): void {
  const root = document.documentElement
  const { h } = color

  if (isDark) {
    root.style.setProperty("--primary",          `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--ring",             `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--sidebar-primary",  `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--sidebar-ring",     `oklch(0.65 0.20 ${h})`)
    root.style.setProperty("--chart-1",          `oklch(0.65 0.20 ${h})`)
  } else {
    root.style.setProperty("--primary",          `oklch(0.52 0.22 ${h})`)
    root.style.setProperty("--ring",             `oklch(0.52 0.22 ${h})`)
    root.style.setProperty("--sidebar-primary",  `oklch(0.65 0.18 ${h})`)
    root.style.setProperty("--sidebar-ring",     `oklch(0.52 0.22 ${h})`)
    root.style.setProperty("--chart-1",          `oklch(0.52 0.22 ${h})`)
  }
}

/** Returns a consistent preview swatch color (mid-lightness, works on any bg) */
export function getPreviewColor(color: ThemeColor): string {
  return `oklch(0.55 0.22 ${color.h})`
}
