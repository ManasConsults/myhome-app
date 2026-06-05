"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  ShoppingCart,
  X,
  CalendarDays,
  StickyNote,
  UtensilsCrossed,
  PiggyBank,
  Receipt,
  Banknote,
  HandCoins,
  ChevronDown,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AppLogoMark } from "@/components/ui/AppLogo"
import { useAuth } from "@/components/providers/AuthProvider"

type SubItem = { href: string; label: string; icon: LucideIcon }
type NavItem  = { href: string; label: string; icon: LucideIcon; subItems?: SubItem[] }

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/finance",
    label: "Finance",
    icon: Wallet,
    subItems: [
      { href: "/finance/budgets", label: "Budgets", icon: PiggyBank },
      { href: "/finance/expenses", label: "Expenses", icon: Receipt },
      { href: "/finance/income", label: "Income", icon: Banknote },
      { href: "/finance/loans", label: "Loans", icon: HandCoins },
    ],
  },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
]

const STORAGE_KEY = "myhome-nav-expanded"

function defaultExpanded(items: NavItem[]): Record<string, boolean> {
  return Object.fromEntries(
    items.filter((i) => i.subItems).map((i) => [i.href, true])
  )
}

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const allNavItems: NavItem[] = [
    ...navItems,
    ...(user?.role === "admin"
      ? [{ href: "/settings/reference-data", label: "Admin", icon: ShieldCheck }]
      : []),
  ]

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    defaultExpanded(allNavItems)
  )

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setExpanded({ ...defaultExpanded(allNavItems), ...JSON.parse(stored) })
    } catch {}
    // Auto-expand if on a sub-route
    allNavItems.forEach((item) => {
      if (item.subItems && window.location.pathname.startsWith(item.href + "/")) {
        setExpanded((prev) => {
          if (prev[item.href]) return prev
          const next = { ...prev, [item.href]: true }
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
          return next
        })
      }
    })
  }, [])

  function toggleExpanded(href: string) {
    setExpanded((prev) => {
      const next = { ...prev, [href]: !prev[href] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  let staggerIndex = 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-sidebar-border">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                  <AppLogoMark className="size-4 text-sidebar-primary-foreground" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-sidebar-foreground text-[15px] tracking-tight">MyHome</span>
                  <span className="text-[10px] text-sidebar-foreground/40 font-medium tracking-widest uppercase">Household</span>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close navigation" className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1">
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
              {allNavItems.map((item) => {
                const exactActive = pathname === item.href
                const anySubActive = item.subItems?.some((s) => pathname === s.href) ?? false
                const inSection = !!item.subItems && pathname.startsWith(item.href + "/")
                const isExpanded = item.subItems ? (expanded[item.href] ?? true) : false
                const idx = staggerIndex++

                return (
                  <div key={item.href}>
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                    >
                      <div className="relative flex items-center rounded-lg">
                        <Link href={item.href} onClick={onClose} className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                              exactActive && !anySubActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : inSection || anySubActive
                                ? "text-sidebar-foreground bg-sidebar-accent"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <item.icon className="size-5 shrink-0" />
                            {item.label}
                          </span>
                        </Link>

                        {item.subItems && (
                          <button
                            onClick={() => toggleExpanded(item.href)}
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                            className={cn(
                              "flex items-center justify-center size-10 shrink-0 transition-colors rounded-lg",
                              inSection || anySubActive || exactActive
                                ? "text-sidebar-foreground hover:bg-sidebar-primary/10"
                                : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <ChevronDown
                              className={cn(
                                "size-4 transition-transform duration-200",
                                isExpanded ? "rotate-0" : "-rotate-90"
                              )}
                            />
                          </button>
                        )}
                      </div>
                    </motion.div>

                    {/* Sub-items */}
                    {item.subItems && (
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 pl-3 mt-0.5 mb-0.5 border-l border-sidebar-border flex flex-col gap-0.5">
                              {item.subItems.map((sub) => {
                                const subActive = pathname === sub.href
                                const subIdx = staggerIndex++
                                return (
                                  <motion.div
                                    key={sub.href}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: subIdx * 0.04, duration: 0.2 }}
                                  >
                                    <Link href={sub.href} onClick={onClose}>
                                      <span
                                        className={cn(
                                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                          subActive
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                        )}
                                      >
                                        <sub.icon className="size-4 shrink-0" />
                                        {sub.label}
                                      </span>
                                    </Link>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                )
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
