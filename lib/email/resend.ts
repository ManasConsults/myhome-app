import { Resend } from "resend"

// Singleton — instantiated once at module load, reused across requests
export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "MyHome <noreply@resend.dev>"

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
