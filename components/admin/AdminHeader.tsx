"use client"

import { ArrowLeft, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminHeader({ title }: { title: string }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 pb-1">
      <header className="h-14 flex items-center gap-3 px-4 bg-background/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">

        {/* Left — back link */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to app</span>
        </button>

        {/* Centre — title + badge */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <ShieldCheck className="size-4 text-warning shrink-0" />
          <h1 className="text-sm font-semibold">{title}</h1>
        </div>

        {/* Right — theme toggle */}
        <div className="shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="size-11 text-muted-foreground hover:text-foreground"
          >
            <Sun data-icon className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon data-icon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>
    </div>
  )
}
