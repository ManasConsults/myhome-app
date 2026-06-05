import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-bold tracking-tight text-muted-foreground/30 mb-4">404</p>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {"The page you're looking for doesn't exist or has been moved."}
        </p>
        <Button render={<Link href="/" />}>
          <Home data-icon="inline-start" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
