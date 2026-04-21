"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"

const COLOR_MAP = {
  primary:     { bg: "bg-primary/10",     text: "text-primary",     dot: "bg-primary" },
  success:     { bg: "bg-success/10",     text: "text-success",     dot: "bg-success" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  warning:     { bg: "bg-warning/10",     text: "text-warning",     dot: "bg-warning" },
} as const

export function ScopeSwitcher() {
  const { groups, activeGroup, setActiveGroup } = useGroup()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const activeColor = COLOR_MAP[activeGroup.color]
  const activeSubtitle = activeGroup.location ?? activeGroup.description ?? ""

  return (
    <div ref={ref} className="relative px-3 py-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent/60 hover:bg-sidebar-accent border border-sidebar-border/50 transition-colors"
      >
        <div className={cn("size-8 rounded-lg flex items-center justify-center text-base shrink-0", activeColor.bg)}>
          {activeGroup.icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{activeGroup.name}</p>
          {activeSubtitle && (
            <p className="text-xs text-sidebar-foreground/50 truncate leading-tight">{activeSubtitle}</p>
          )}
        </div>
        <ChevronDown className={cn("size-3.5 text-sidebar-foreground/50 transition-transform duration-200 shrink-0", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-3 right-3 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="px-2 py-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Households</p>
              {groups.map((g) => {
                const c = COLOR_MAP[g.color]
                const isActive = activeGroup.id === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => { setActiveGroup(g.id); setOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className={cn("size-7 rounded-md flex items-center justify-center text-sm shrink-0", c.bg)}>
                      {g.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      {g.location && <p className="text-xs text-muted-foreground truncate">{g.location}</p>}
                    </div>
                    {isActive && <Check className={cn("size-3.5 shrink-0", c.text)} />}
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
