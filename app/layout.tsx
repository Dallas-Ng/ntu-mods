import "@/styles/globals.css"
import { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { INIT_GA } from "@/lib/gtag"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import NavigationBar from "@/components/navbar"
import { NotificationBanner } from "@/components/notification-banner"
import StarsManageButton from "@/components/stars-buttons/stars-manage-button"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`
  },
  description: siteConfig.description,

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png"
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  INIT_GA()

  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "flex min-h-screen flex-col bg-background font-sans antialiased",
            fontSans.variable
          )}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NotificationBanner.inAlpha />

            <NavigationBar />

            <div className="flex-1">{children}</div>

            <footer className="py-2">
              <p className="text-center text-sm">Dallas &copy; 2024</p>
            </footer>

            <StarsManageButton />
            <TailwindIndicator />
            <Toaster />
          </ThemeProvider>

          <Analytics />
        </body>
      </html>
    </>
  )
}
