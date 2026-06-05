import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/db/prisma"
import type { UserRole } from "@/lib/session"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
        if (!user || user.status !== "active") return null

        const stored = user.password ?? ""
        const isPlaintext = !stored.startsWith("$2")
        const valid = isPlaintext
          ? stored.length === password.length &&
            timingSafeEqual(Buffer.from(stored), Buffer.from(password))
          : await bcrypt.compare(password, stored)
        if (!valid) return null

        if (isPlaintext) {
          await prisma.user.update({
            where: { id: user.id },
            data: { password: await bcrypt.hash(password, 12) },
          })
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role as UserRole }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github") return true

      const email = user.email?.toLowerCase()
      if (!email) return false

      const existing = await prisma.user.findUnique({ where: { email } })

      if (existing) {
        if (existing.status === "pending") return "/login?error=OAuthPending"
        if (existing.status === "rejected") return "/login?error=OAuthRejected"
        return true
      }

      // New user via GitHub — same approval flow as email registration
      const isFirstUser = (await prisma.user.count()) === 0
      const newUser = await prisma.user.create({
        data: {
          name: user.name ?? email.split("@")[0],
          email,
          role: isFirstUser ? "admin" : "user",
          status: isFirstUser ? "active" : "pending",
        },
      })

      if (isFirstUser) {
        await prisma.group.create({
          data: { name: "My Home", icon: "🏠", color: "primary", currency: "USD", isDefault: true, userId: newUser.id },
        })
        return true
      }

      return "/login?error=OAuthPending"
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "github") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email!.toLowerCase() },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.sub = dbUser.id
          token.role = dbUser.role
        }
      } else if (user) {
        token.role = (user as { role: UserRole }).role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as UserRole
      session.user.image = (token.picture as string | null | undefined) ?? null
      return session
    },
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
})
