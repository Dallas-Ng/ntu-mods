import { Metadata } from "next"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: siteConfig.metatags.faq.title,
  description: siteConfig.metatags.faq.desc,
  alternates: { canonical: "/faq" }
}

interface LayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: LayoutProps) {
  return children
}
