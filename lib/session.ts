export type UserRole = "admin" | "manager" | "user"
export type UserStatus = "pending" | "active" | "rejected"

// ── App settings (client-only, persisted to localStorage) ────────────────────

export type AppSettings = {
  defaultCurrency: string
  defaultTimezone: string
  defaultThemeColor: string
}

export const APP_SETTINGS_KEY = "myhome-app-settings"

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultCurrency: "AUD",
  defaultTimezone: "Australia/Brisbane",
  defaultThemeColor: "indigo",
}

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY)
    return raw ? { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULT_APP_SETTINGS
  } catch {
    return DEFAULT_APP_SETTINGS
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings))
  } catch {}
}
