import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import "./globals.css"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import ClarityTag from "@/components/clarity"
import GTag from "@/components/gtag"
import MobileTracker from "@/components/mobile-tracker"
import TailwindIndicator from "@/components/tailwind-indicator"
import ThemeProvider from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

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
    icon: "/favicon.ico"
    // shortcut: "/favicon-16x16.png",
    // apple: "/apple-touch-icon.png"
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

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased ")}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}

          <MobileTracker />
          <Toaster position="top-center" />
          <GTag />
          <ClarityTag />
          <TailwindIndicator />
        </ThemeProvider>
      </body>
    </html>
  )
}
