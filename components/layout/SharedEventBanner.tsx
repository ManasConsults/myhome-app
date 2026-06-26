"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGroup } from "@/components/providers/GroupProvider"
import type { SharedEvent } from "@/lib/types"

export function SharedEventBanner() {
  const { activeEvent, isSharedEvent, clearActiveEvent } = useGroup()

  if (!isSharedEvent || !activeEvent) return null

  const shared = activeEvent as SharedEvent

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl mb-3",
        "bg-primary/8 border border-primary/20",
      )}
    >
      <span className="text-base shrink-0">{shared.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-primary truncate">{shared.name}</span>
        <span className="text-xs text-muted-foreground ml-2">
          Shared by {shared.sharedByName}
        </span>
      </div>
      <button
        onClick={clearActiveEvent}
        className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        aria-label="Clear shared event"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  )
}
