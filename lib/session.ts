import { SignJWT, jwtVerify } from "jose"

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

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? "")
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    }
  } catch {
    return null
  }
}

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
