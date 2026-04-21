"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"
import type { Group } from "@/lib/dummy-data"

const COLOR_MAP: Record<Group["color"], { bg: string; text: string; dot: string }> = {
  primary:     { bg: "bg-primary/10",     text: "text-primary",     dot: "bg-primary" },
  success:     { bg: "bg-success/10",     text: "text-success",     dot: "bg-success" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  warning:     { bg: "bg-warning/10",     text: "text-warning",     dot: "bg-warning" },
}

export function GroupSwitcher() {
  const { groups, activeGroup, setActiveGroup: setActiveGroupId } = useGroup()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const colors = COLOR_MAP[activeGroup.color]

  return (
    <div ref={ref} className="relative px-3 pb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors text-left",
          "border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent"
        )}
      >
        <span className={cn("size-7 rounded-lg flex items-center justify-center text-sm shrink-0", colors.bg)}>
          {activeGroup.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-sidebar-foreground truncate">{activeGroup.name}</p>
          <p className="text-[10px] text-sidebar-foreground/50 capitalize">{activeGroup.type}</p>
        </div>
        <ChevronDown className={cn("size-3.5 text-sidebar-foreground/50 transition-transform duration-200 shrink-0", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-sidebar-border bg-sidebar shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden"
          >
            <div className="p-1 flex flex-col gap-0.5">
              {groups.map((group) => {
                const gc = COLOR_MAP[group.color]
                const isActive = group.id === activeGroup.id
                return (
                  <button
                    key={group.id}
                    onClick={() => { setActiveGroupId(group.id); setOpen(false) }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors",
                      isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
                    )}
                  >
                    <span className={cn("size-7 rounded-lg flex items-center justify-center text-sm shrink-0", gc.bg)}>
                      {group.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-sidebar-foreground truncate">{group.name}</p>
                      <p className="text-[10px] text-sidebar-foreground/50 capitalize">
                        {group.type}{group.location ? ` · ${group.location}` : ""}
                      </p>
                    </div>
                    {isActive && <Check className="size-3.5 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-sidebar-border p-1">
              <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors">
                <Plus className="size-3.5" />
                New group
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
