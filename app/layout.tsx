import "@/styles/globals.css"
import { Metadata, Viewport } from "next"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import NavigationBar from "@/components/navigation/navigation-bar"
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
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div
              className="relative flex min-h-screen flex-col"
              style={{ background: "rgb(233 240 245)" }}>
              <div className="text-[14px] text-center py-2 bg-emerald-500 dark:bg-emerald-700 text-white">
                The website is still in <u>beta</u> which means you might
                encounter some errors... Report any bugs and let us know how to
                improve!
              </div>

              <NavigationBar />

              <div className="flex-1">{children}</div>

              <footer className="py-2">
                <p className="text-sm text-center">Dallas &copy; 2024</p>
              </footer>
            </div>

            <TailwindIndicator />
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
