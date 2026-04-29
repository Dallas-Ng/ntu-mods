import { Metadata } from "next"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: siteConfig.metatags.changelog.title,
  description: siteConfig.metatags.changelog.desc
}

interface LayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: LayoutProps) {
  return children
}
