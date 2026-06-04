import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE, verifySession } from "@/lib/session"

export async function GET() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json(null)
  const user = await verifySession(token)
  return NextResponse.json(user)
}
