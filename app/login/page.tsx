"use client"

import { Suspense, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppLogoMark } from "@/components/ui/AppLogo"
import { Github } from "lucide-react"
import { getLoginBlockReason } from "@/lib/actions/auth"

function oauthErrorMessage(error: string | null): string {
  if (error === "OAuthPending") return "Your account is awaiting admin approval."
  if (error === "OAuthRejected") return "Your account request was not approved. Contact the admin."
  if (error === "CredentialsSignin") return "Invalid email or password."
  if (error) return "Invalid email or password."
  return ""
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)

  useEffect(() => {
    const msg = oauthErrorMessage(searchParams.get("error"))
    if (msg) setError(msg)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const blockReason = await getLoginBlockReason(email)
    if (blockReason) {
      setError(blockReason)
      setLoading(false)
      return
    }

    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)

    if (!result?.ok || result?.error) {
      setError("Invalid email or password.")
      return
    }

    window.location.href = "/"
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <AppLogoMark className="size-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MyHome</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key="error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full mt-1" disabled={loading || githubLoading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || githubLoading}
              onClick={() => {
                setGithubLoading(true)
                signIn("github", { callbackUrl: "/" })
              }}
            >
              <Github data-icon />
              {githubLoading ? "Redirecting…" : "Continue with GitHub"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Register
          </Link>
        </p>

        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-center text-muted-foreground/60">
            Dev seed: demo@myhome.app / demo1234
          </p>
        )}
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
