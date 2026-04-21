import { NextRequest, NextResponse } from "next/server"
import { decodeSession } from "@/lib/dummy-users"

const PUBLIC_PATHS = ["/login", "/register"]

export default function proxy(request: NextRequest) {
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
