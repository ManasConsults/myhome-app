import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { ThemeColorProvider } from "@/components/providers/ThemeColorProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: { default: "MyHome", template: "%s | MyHome" },
  description: "Manage your home finances, tasks, and more.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={fontSans.variable}
    >
      <body className="min-h-screen bg-background antialiased font-sans">
        <AuthProvider>
          <ThemeProvider>
            <ThemeColorProvider>
              {children}
            </ThemeColorProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
