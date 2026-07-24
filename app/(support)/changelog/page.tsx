import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import ChangelogContent from "@/components/changelog/changelog-content"

export const metadata: Metadata = {
  title: siteConfig.metatags.changelog.title,
  description: siteConfig.metatags.changelog.desc,
  alternates: { canonical: "/changelog" }
}

export default function ChangelogPage() {
  return <ChangelogContent />
}
