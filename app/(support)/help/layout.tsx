import { Metadata } from "next"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: siteConfig.metatags.help.title,
  description: siteConfig.metatags.help.desc,
  alternates: { canonical: "/help" }
}

interface LayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: LayoutProps) {
  return children
}
