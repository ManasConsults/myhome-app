"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6 font-sans bg-background text-foreground">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6">
            A critical error occurred. Please reload the page.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
