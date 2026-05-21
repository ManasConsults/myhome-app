"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { getAppSettings, saveAppSettings } from "@/lib/session"
import type { UserRole } from "@/lib/session"

const ROLE_PILL: Record<UserRole, { label: string; className: string }> = {
  admin:   { label: "Admin",   className: "bg-primary/10 text-primary" },
  manager: { label: "Manager", className: "bg-warning/10 text-warning" },
  user:    { label: "Member",  className: "bg-muted text-muted-foreground" },
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
}

const CURRENCIES = ["AUD", "USD", "EUR", "GBP", "CAD", "NZD", "SGD", "INR"]

const TIMEZONES = [
  "Australia/Brisbane",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Adelaide",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
]

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currency, setCurrency] = useState("AUD")
  const [timezone, setTimezone] = useState("Australia/Brisbane")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
    const settings = getAppSettings()
    setCurrency(settings.defaultCurrency)
    setTimezone(settings.defaultTimezone)
  }, [user])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (user) setUser({ ...user, name, email, role: user.role })
    saveAppSettings({ defaultCurrency: currency, defaultTimezone: timezone, defaultThemeColor: getAppSettings().defaultThemeColor })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initials = getInitials(name)

  return (
    <>
      <Header title="Edit Profile" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-2xl w-full mx-auto">
        <Card className="border-border/60">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* Avatar preview */}
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{name || "Your name"}</p>
                    {user?.role && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_PILL[user.role].className}`}>
                        {ROLE_PILL[user.role].label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{email || "Your email"}</p>
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Currency */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 justify-end pt-1">
                {saved && <p className="text-sm text-success">Changes saved</p>}
                <Button type="submit" size="sm">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
