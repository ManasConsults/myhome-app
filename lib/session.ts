export type UserRole = "admin" | "manager" | "user"
export type UserStatus = "pending" | "active" | "rejected"

export type SessionPayload = {
  userId: string
  name: string
  email: string
  role: UserRole
}

export const SESSION_COOKIE = "myhome-session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function encodeSession(payload: SessionPayload): string {
  return btoa(JSON.stringify(payload))
}

export function decodeSession(value: string): SessionPayload | null {
  try {
    return JSON.parse(atob(value)) as SessionPayload
  } catch {
    return null
  }
}

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
