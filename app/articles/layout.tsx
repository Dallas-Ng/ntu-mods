import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.articles.title,
  description: siteConfig.metatags.articles.desc,
  alternates: {
    canonical: "/articles"
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutDefault>{children}</LayoutDefault>
}
