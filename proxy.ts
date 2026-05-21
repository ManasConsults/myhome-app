import { NextRequest, NextResponse } from "next/server"
import { decodeSession } from "@/lib/session"

const PUBLIC_PATHS = ["/login", "/register"]

// ALLOWED_DOMAIN is set in Vercel env vars (production + preview).
// Omit in local dev (.env.local) to skip the check.
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN

export default function proxy(request: NextRequest) {
  if (ALLOWED_DOMAIN) {
    const host = request.headers.get("host") ?? ""
    // Strip port for local/preview comparisons
    const hostname = host.split(":")[0]
    if (hostname !== ALLOWED_DOMAIN && !hostname.endsWith(`.${ALLOWED_DOMAIN}`)) {
      return new NextResponse("Not found", { status: 404 })
    }
  }

  const { pathname } = request.nextUrl
  const session = request.cookies.get("myhome-session")

  // Admin gate — must be authenticated AND role === "admin"
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url))
    const payload = decodeSession(session.value)
    if (payload?.role !== "admin") return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", request.url))
  if (session && isPublic) return NextResponse.redirect(new URL("/", request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public/).*)"],
}
