// Dummy auth — plain-text passwords are intentional for the UI-first phase.
// Replace entirely with Auth.js + Drizzle when the backend phase begins.

export type UserRole = "admin" | "manager" | "user"

export type DummyUser = {
  id: string
  name: string
  email: string
  password: string // plain text — dummy phase only
  role: UserRole
  createdAt: string
}

export type SessionPayload = {
  userId: string
  name: string
  email: string
  role: UserRole
}

export const SESSION_COOKIE = "myhome-session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Seeded demo account — always present
export const SEED_USER: DummyUser = {
  id: "user-1",
  name: "Manas Mallick",
  email: "demo@myhome.app",
  password: "demo1234",
  role: "admin",
  createdAt: "2024-01-01",
}

const STORAGE_KEY = "myhome-registered-users"

export function getRegisteredUsers(): DummyUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DummyUser[]) : []
  } catch {
    return []
  }
}

export function registerUser(user: DummyUser): void {
  try {
    const existing = getRegisteredUsers()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, user]))
  } catch {}
}

export function findUser(email: string, password: string): DummyUser | null {
  const all = [SEED_USER, ...getRegisteredUsers()]
  return (
    all.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    ) ?? null
  )
}

export function findUserByEmail(email: string): DummyUser | null {
  const all = [SEED_USER, ...getRegisteredUsers()]
  return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
}

// ─── Admin mutations ──────────────────────────────────────────────────────────

export function updateUserRole(userId: string, role: UserRole): void {
  if (userId === SEED_USER.id) return // SEED_USER is immutable
  try {
    const users = getRegisteredUsers()
    const updated = users.map((u) => (u.id === userId ? { ...u, role } : u))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

export function deleteUser(userId: string): void {
  if (userId === SEED_USER.id) return // SEED_USER is immutable
  try {
    const users = getRegisteredUsers()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users.filter((u) => u.id !== userId)))
  } catch {}
}

// ─── App-wide settings ────────────────────────────────────────────────────────

export type AppSettings = {
  defaultCurrency: string   // ISO 4217
  defaultTimezone: string
  defaultThemeColor: string // theme color id from THEME_COLORS
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

// Retroactively patch currency on all stored user groups when default changes
export function patchAllGroupCurrencies(currency: string): void {
  try {
    const allUsers = [SEED_USER, ...getRegisteredUsers()]
    for (const user of allUsers) {
      const key = `myhome-user-groups-${user.id}`
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const groups = JSON.parse(raw) as Array<{ currency?: string }>
      const patched = groups.map((g) => ({ ...g, currency }))
      localStorage.setItem(key, JSON.stringify(patched))
    }
  } catch {}
}

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
