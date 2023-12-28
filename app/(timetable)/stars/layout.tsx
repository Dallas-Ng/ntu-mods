import { Metadata } from "next"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: siteConfig.metatags.stars.title,
  description: siteConfig.metatags.stars.desc
}

interface LayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: LayoutProps) {
  return children
}
