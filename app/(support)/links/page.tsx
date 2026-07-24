import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LinksContent from "@/components/links/links-content"

export const metadata: Metadata = {
  title: siteConfig.metatags.studentLinks.title,
  description: siteConfig.metatags.studentLinks.desc,
  alternates: { canonical: "/links" }
}

export default function LinksPage() {
  return <LinksContent />
}
