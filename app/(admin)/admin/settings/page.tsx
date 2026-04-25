"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminHeader } from "@/components/admin/AdminHeader"
import {
  getAppSettings,
  saveAppSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from "@/lib/dummy-users"
import { THEME_COLORS } from "@/lib/theme-colors"

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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(getAppSettings())
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    saveAppSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <AdminHeader title="App Settings" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 max-w-3xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                Defaults for new users
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default currency</label>
                  <p className="text-xs text-muted-foreground">Applied to new user groups. Retroactively patches existing stored groups.</p>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings((s) => ({ ...s, defaultCurrency: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default timezone</label>
                  <p className="text-xs text-muted-foreground">Pre-filled on the register form for new accounts.</p>
                  <select
                    value={settings.defaultTimezone}
                    onChange={(e) => setSettings((s) => ({ ...s, defaultTimezone: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Default theme colour</label>
                  <p className="text-xs text-muted-foreground">Applied when a new user first opens the app.</p>
                  <select
                    value={settings.defaultThemeColor}
                    onChange={(e) => setSettings((s) => ({ ...s, defaultThemeColor: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {THEME_COLORS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3 justify-end pt-1">
                  {saved && <p className="text-sm text-success">Settings saved</p>}
                  <Button type="submit" size="sm">Save changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  )
}
