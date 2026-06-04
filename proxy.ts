import { auth } from "@/auth"
import { NextResponse } from "next/server"

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN

export default auth((req) => {
  if (ALLOWED_DOMAIN) {
    const hostname = (req.headers.get("host") ?? "").split(":")[0]
    if (hostname !== ALLOWED_DOMAIN && !hostname.endsWith(`.${ALLOWED_DOMAIN}`)) {
      return new NextResponse("Not found", { status: 404 })
    }
  }

  const { pathname } = req.nextUrl
  const session = req.auth

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url))
    if (session.user.role !== "admin") return NextResponse.redirect(new URL("/", req.url))
    return NextResponse.next()
  }

  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", req.url))
  if (session && isPublic) return NextResponse.redirect(new URL("/", req.url))

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public/).*)"],
}
