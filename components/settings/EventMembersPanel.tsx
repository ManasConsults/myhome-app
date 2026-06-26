"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getEventMembers, addEventMember, removeEventMember } from "@/lib/actions/event-members"
import type { EventMember } from "@/lib/types"

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

type Props = {
  eventId: string
  eventName: string
}

export function EventMembersPanel({ eventId, eventName }: Props) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const { data: members = [], isPending } = useQuery<EventMember[]>({
    queryKey: ["event-members", eventId],
    queryFn: () => getEventMembers(eventId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["event-members", eventId] })

  const addMutation = useMutation({
    mutationFn: (emailVal: string) => addEventMember(eventId, emailVal),
    onSuccess: (result) => {
      if (result.success) {
        setEmail("")
        setAddError(null)
        invalidate()
      } else {
        setAddError(result.error)
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeEventMember(eventId, userId),
    onSuccess: () => {
      setRemoveId(null)
      invalidate()
    },
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setAddError(null)
    addMutation.mutate(email.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="pt-3 mt-3 border-t border-border/60 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Members — {eventName}
        </p>

        {/* Add member form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <label htmlFor={`add-member-${eventId}`} className="sr-only">Email address</label>
          <input
            id={`add-member-${eventId}`}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setAddError(null) }}
            autoComplete="email"
            spellCheck={false}
            className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={addMutation.isPending || !email.trim()}
            className="h-8 shrink-0"
          >
            {addMutation.isPending
              ? <Loader2 className="size-3.5 animate-spin" />
              : <UserPlus className="size-3.5" />
            }
            Add
          </Button>
        </form>

        {addError && (
          <p role="alert" className="text-xs text-destructive">{addError}</p>
        )}

        {/* Member list */}
        {isPending ? (
          <p className="text-xs text-muted-foreground">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="text-xs text-muted-foreground">No members yet. Add someone by email above.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {members.map((m) => {
                const isRemoving = removeId === m.userId
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(m.userName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.userEmail}</p>
                    </div>
                    {isRemoving ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">Remove?</span>
                        <button
                          onClick={() => removeMutation.mutate(m.userId)}
                          disabled={removeMutation.isPending}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setRemoveId(null)}
                          className="px-2 py-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRemoveId(m.userId)}
                        className={cn(
                          "size-7 flex items-center justify-center rounded-lg shrink-0",
                          "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        )}
                        aria-label={`Remove ${m.userName}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
