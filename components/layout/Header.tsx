"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "./MobileNav"
import { GlobalSearch } from "./GlobalSearch"
import { ProfileDropdown } from "./ProfileDropdown"
import { useState } from "react"

export function Header({ title }: { title: string }) {
  const { theme, setTheme } = useTheme()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <div className="sticky top-0 z-40 px-3 pt-3 pb-1">
        <header className="h-14 flex items-center gap-3 px-4 md:px-5 bg-background/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">

          {/* Left — hamburger + title */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </Button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          {/* Center — search (flex-1 to fill space) */}
          <div className="flex-1 flex justify-center px-2 md:px-4">
            <GlobalSearch />
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile search icon is rendered inside GlobalSearch itself */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button variant="ghost" size="icon" aria-label="Notifications" className="text-muted-foreground hover:text-foreground relative">
              <Bell />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
            </Button>

            <ProfileDropdown />
          </div>
        </header>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  )
}
