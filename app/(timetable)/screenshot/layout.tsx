import { Metadata } from "next"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: siteConfig.metatags.screenshot.title,
  description: siteConfig.metatags.screenshot.desc,
  alternates: { canonical: "/screenshot" }
}

interface LayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: LayoutProps) {
  return children
}
