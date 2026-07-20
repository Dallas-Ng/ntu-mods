import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import "./globals.css"

import { Author } from "next/dist/lib/metadata/types/metadata-types"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import AppBanner from "@/components/app-banner"
import AppearanceStyleProvider from "@/components/appearance-style-provider"
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
  keywords: defaults.keywords as unknown as string[],
  authors: defaults.authors as unknown as Author[],
  // creator: "Dallas Ng",
  icons: {
    icon: "/favicon.ico"
    // shortcut: "/favicon-16x16.png",
    // apple: "/apple-touch-icon.png"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: defaults.title,
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
    title: defaults.title,
    description: defaults.desc,
    images: [siteConfig.ogImage]
    // creator: "@dallas-ng"
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" }
  ],
  width: "device-width",
  initialScale: 1
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
      </head>
      <body className={cn(inter.className, "antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          themes={["light", "dark", "paper"]}>
          <AppearanceStyleProvider />
          <AppBanner />
          {children}
          <MobileTracker />
          <Toaster position="top-center" />
          <GTag />
          <ClarityTag />
          {process.env.NODE_ENV === "development" && <TailwindIndicator />}
        </ThemeProvider>
      </body>
    </html>
  )
}
