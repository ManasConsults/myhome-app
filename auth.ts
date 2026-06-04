import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"
import type { UserRole } from "@/lib/session"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
        if (!user || user.status !== "active") return null

        const stored = user.password ?? ""
        const isPlaintext = !stored.startsWith("$2")
        const valid = isPlaintext
          ? stored === password
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
    jwt({ token, user }) {
      if (user) token.role = (user as { role: UserRole }).role
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as UserRole
      return session
    },
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
})
