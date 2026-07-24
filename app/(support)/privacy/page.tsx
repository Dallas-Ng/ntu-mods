import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import PrivacyContent from "@/components/privacy/privacy-content"

export const metadata: Metadata = {
  title: siteConfig.metatags.privacy.title,
  description: siteConfig.metatags.privacy.desc,
  alternates: { canonical: "/privacy" }
}

export default function HelpPage() {
  return <PrivacyContent />
}
