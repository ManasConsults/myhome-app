import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "myhome-session"
const PUBLIC_PATHS = ["/login", "/register"]

// ALLOWED_DOMAIN is set in Vercel env vars (production + preview).
// Omit in local dev (.env.local) to skip the check.
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN

async function verifyToken(token: string): Promise<{ role?: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "")
    const { payload } = await jwtVerify(token, secret)
    return payload as { role?: string }
  } catch {
    return null
  }
}

export default async function proxy(request: NextRequest) {
  if (ALLOWED_DOMAIN) {
    const host = request.headers.get("host") ?? ""
    const hostname = host.split(":")[0]
    if (hostname !== ALLOWED_DOMAIN && !hostname.endsWith(`.${ALLOWED_DOMAIN}`)) {
      return new NextResponse("Not found", { status: 404 })
    }
  }

  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value

  // Admin gate — must be authenticated AND role === "admin"
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url))
    const payload = await verifyToken(token)
    if (payload?.role !== "admin") return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!token && !isPublic) return NextResponse.redirect(new URL("/login", request.url))

  if (token && isPublic) {
    // Only redirect if the token is valid — expired/tampered tokens let the
    // user through to the login page so they can re-authenticate
    const payload = await verifyToken(token)
    if (payload) return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public/).*)"],
}
