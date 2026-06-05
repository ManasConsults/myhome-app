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
import { ScopeSwitcher } from "./ScopeSwitcher"
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

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const bottomItems: NavItem[] = user?.role === "admin"
    ? [{ href: "/settings/reference-data", label: "Admin", icon: ShieldCheck }]
    : []

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    defaultExpanded([...navItems, ...bottomItems])
  )
  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setExpanded({ ...defaultExpanded([...navItems, ...bottomItems]), ...JSON.parse(stored) })
    } catch {}
  // bottomItems ref changes every render — only hydrate once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-expand parent when navigating directly to a sub-route
  useEffect(() => {
    [...navItems, ...bottomItems].forEach((item) => {
      if (item.subItems && pathname.startsWith(item.href + "/")) {
        setExpanded((prev) => {
          if (prev[item.href]) return prev
          const next = { ...prev, [item.href]: true }
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
          return next
        })
      }
    })
  }, [pathname])

  function toggleExpanded(href: string) {
    setExpanded((prev) => {
      const next = { ...prev, [href]: !prev[href] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function renderNavItem(item: NavItem) {
    const exactActive = pathname === item.href
    const anySubActive = item.subItems?.some((s) => pathname === s.href) ?? false
    const inSection = !!item.subItems && pathname.startsWith(item.href + "/")
    const showParentPill = exactActive && !anySubActive
    const isExpanded = item.subItems ? (expanded[item.href] ?? true) : false

    const parentTextClass = showParentPill
      ? "text-sidebar-primary-foreground"
      : inSection || anySubActive
      ? "text-sidebar-foreground"
      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"

    return (
      <div key={item.href}>
        {/* Parent row */}
        <div className="relative flex items-center rounded-lg">
          {/* Active pill — pointer-events-none so link/button underneath are clickable */}
          {showParentPill && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-lg bg-sidebar-primary pointer-events-none"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}

          {/* Background for in-section state */}
          {!showParentPill && (inSection || anySubActive) && (
            <span className="absolute inset-0 rounded-lg bg-sidebar-accent pointer-events-none" />
          )}

          <Link href={item.href} className="flex-1 min-w-0">
            <span
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                parentTextClass
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </span>
          </Link>

          {/* Collapse toggle — only for items with sub-items */}
          {item.subItems && (
            <button
              onClick={() => toggleExpanded(item.href)}
              aria-label={isExpanded ? "Collapse" : "Expand"}
              className={cn(
                "relative flex items-center justify-center size-8 mr-1 rounded-md transition-colors",
                showParentPill
                  ? "text-sidebar-primary-foreground hover:bg-white/10"
                  : inSection || anySubActive
                  ? "text-sidebar-foreground hover:bg-sidebar-primary/10"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isExpanded ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
          )}
        </div>

        {/* Sub-items with animated expand/collapse */}
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
                <div className="ml-3 pl-3 mt-0.5 mb-0.5 border-l border-sidebar-border flex flex-col gap-0.5">
                  {item.subItems.map((sub) => {
                    const subActive = pathname === sub.href
                    return (
                      <Link key={sub.href} href={sub.href}>
                        <span
                          className={cn(
                            "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            subActive
                              ? "text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          {subActive && (
                            <motion.span
                              layoutId="sidebar-sub-active"
                              className="absolute inset-0 rounded-lg bg-sidebar-primary"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <sub.icon className="relative size-3.5 shrink-0" />
                          <span className="relative">{sub.label}</span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-60 h-[calc(100vh-1.5rem)] sticky top-3 m-3 bg-sidebar rounded-2xl shrink-0 overflow-hidden border border-sidebar-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.25)]">
      {/* Logo */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2.5 px-4 h-14 bg-sidebar-accent/60 rounded-2xl border border-sidebar-border shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45),0_1px_4px_rgba(0,0,0,0.25)]">
          <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <AppLogoMark className="size-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sidebar-foreground text-[15px] tracking-tight">MyHome</span>
            <span className="text-[10px] text-sidebar-foreground/40 font-medium tracking-widest uppercase">Household</span>
          </div>
        </div>
      </div>

      {/* Scope switcher */}
      <ScopeSwitcher />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Bottom — admin only */}
      {bottomItems.length > 0 && (
        <div className="px-3 py-4 border-t border-sidebar-border flex flex-col gap-0.5">
          {bottomItems.map(renderNavItem)}
        </div>
      )}
    </aside>
  )
}
