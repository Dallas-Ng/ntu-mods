import "@/styles/globals.css"
import { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import ClarityTag from "@/components/clarity"
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
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <ClarityTag />

        <body className={cn("font-sans antialiased", fontSans.variable)}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex h-screen w-screen flex-col ">
              <NotificationBanner.inAlpha />

              <NavigationBar />

              <div className="flex-1">
                <div className="relative z-[1]">{children}</div>
              </div>

              <footer className="z-[1] py-2">
                <p className="text-center text-sm">Dallas &copy; 2024</p>
              </footer>
            </div>

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
