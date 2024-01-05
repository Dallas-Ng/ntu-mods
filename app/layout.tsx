import "@/styles/globals.css"
import { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import ClarityTag from "@/components/clarity"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

const defaults = siteConfig.metatags.default

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaults.title,
    template: `%s - ${siteConfig.name}`
  },
  description: defaults.desc,
  keywords: defaults.keywords,
  authors: defaults.authors,
  creator: "Dallas Ng",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: defaults.desc,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: defaults.desc,
    images: [siteConfig.ogImage],
    creator: "@dallas-ng"
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
        <body className={cn("font-sans antialiased", fontSans.variable)}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}

            {/* Auxillary services */}
            <ClarityTag />
            <TailwindIndicator />
            <Toaster position="top-center" />
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
