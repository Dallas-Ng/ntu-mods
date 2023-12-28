import "@/styles/globals.css"
import { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import ClarityTag from "@/components/clarity"
import Footer from "@/components/footer"
import NavigationBar from "@/components/navbar"
import { NotificationBanner } from "@/components/notification-banner"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: siteConfig.metatags.default.title,
    template: `%s - ${siteConfig.name}`
  },
  description: siteConfig.metatags.default.desc,
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
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <ClarityTag />

        <body
          className={cn(
            "relative flex min-h-screen flex-col font-sans antialiased",
            fontSans.variable
          )}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NotificationBanner.inBeta />

            <NavigationBar />

            <div className="container relative z-[2] flex-1 px-2 md:px-0">
              {children}
            </div>

            <Footer className="relative z-[1] py-2" />

            <TailwindIndicator />
            <Toaster position="top-center" />
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
