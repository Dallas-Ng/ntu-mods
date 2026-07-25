import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import SitemapContent from "@/components/sitemap/sitemap-content"

export const dynamic = "force-static"
export const revalidate = false

export const metadata: Metadata = {
  title: siteConfig.metatags.sitemap.title,
  description: siteConfig.metatags.sitemap.desc,
  alternates: { canonical: "/sitemap" },
  robots: { index: false, follow: true }
}

export default function SitemapPage() {
  return <SitemapContent />
}
