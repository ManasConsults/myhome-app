"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Globe, Home, ChevronRight, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { ColorPicker } from "@/components/settings/ColorPicker"
import { ThemeModePicker } from "@/components/settings/ThemeModePicker"
import { GroupsManager } from "@/components/settings/GroupsManager"
import { EventsManager } from "@/components/settings/EventsManager"
import { Header } from "@/components/layout/Header"
import { useAuth } from "@/components/providers/AuthProvider"
import { getAppSettings } from "@/lib/session"

type Tab = "general" | "groups" | "events"

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "groups", label: "Groups" },
  { id: "events", label: "Events" },
]

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
}

export default function SettingsPage() {
  const { user } = useAuth()
  const settings = getAppSettings()
  const [activeTab, setActiveTab] = useState<Tab>("general")

  const name = user?.name ?? ""
  const email = user?.email ?? ""
  const initials = getInitials(name)

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-2xl w-full mx-auto">

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="settings-tab-pill"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <>
            {/* Profile */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-base">{name || "—"}</p>
                    <p className="text-sm text-muted-foreground">{email || "—"}</p>
                    <Badge variant="outline" className="mt-1.5 text-xs">Free plan</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Palette className="size-4 text-muted-foreground" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex flex-col gap-5">
                <div>
                  <p className="text-sm font-medium mb-1">Mode</p>
                  <p className="text-xs text-muted-foreground mb-3">Choose light, dark, or follow your system</p>
                  <ThemeModePicker />
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Accent color</p>
                  <p className="text-xs text-muted-foreground mb-4">Applies instantly across the entire app</p>
                  <ColorPicker />
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {[
                  { label: "Currency", value: settings.defaultCurrency },
                  { label: "Timezone", value: settings.defaultTimezone },
                  { label: "Date format", value: "DD/MM/YYYY" },
                  { label: "Language", value: "English" },
                ].map((pref, i, arr) => (
                  <div key={pref.label}>
                    <div className="flex items-center justify-between py-3">
                      <p className="text-sm font-medium">{pref.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{pref.value}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                    {i < arr.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bell className="size-4 text-muted-foreground" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {(
                  [
                    { key: "budgetAlerts", label: "Budget alerts", description: "Notify when nearing budget limit", defaultOn: true },
                    { key: "taskReminders", label: "Task reminders", description: "Reminders for upcoming due dates", defaultOn: true },
                    { key: "weeklyReport", label: "Weekly report", description: "Summary of your week every Sunday", defaultOn: false },
                  ] as const
                ).map(({ key, label, description, defaultOn }, i, arr) => (
                  <div key={key}>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <div className={cn(
                        "w-10 h-6 rounded-full relative transition-colors",
                        defaultOn ? "bg-primary" : "bg-muted"
                      )}>
                        <div className={cn(
                          "absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform",
                          defaultOn ? "translate-x-5" : "translate-x-1"
                        )} />
                      </div>
                    </div>
                    {i < arr.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* About */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Home className="size-4 text-muted-foreground" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {[
                  { label: "Version", value: "0.1.0" },
                  { label: "Built with", value: "Next.js 16 + Tailwind v4" },
                  { label: "Built by", value: "https://manasconsults.net" },
                ].map((item, i, arr) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between py-3">
                      <p className="text-sm font-medium">{item.label}</p>
                      <span className="text-sm text-muted-foreground">{item.value}</span>
                    </div>
                    {i < arr.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "groups" && <GroupsManager />}

        {activeTab === "events" && <EventsManager />}

      </main>
    </>
  )
}
