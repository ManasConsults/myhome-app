"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { AppEvent } from "@/lib/types"

type EventFilterProps = {
  events: AppEvent[]
  activeEvent: AppEvent | null
  onSelect: (id: string | null) => void
}

export function EventFilter({ events, activeEvent, onSelect }: EventFilterProps) {
  if (events.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium transition-colors",
          !activeEvent
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        All
      </button>
      <AnimatePresence initial={false}>
        {events.map((ev) => (
          <motion.button
            key={ev.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelect(ev.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
              activeEvent?.id === ev.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span>{ev.icon}</span>
            {ev.name}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
