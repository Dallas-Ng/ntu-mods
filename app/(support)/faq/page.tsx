import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import FaqContent, { faqJsonLd } from "@/components/faq/faq-content"

export const metadata: Metadata = {
  title: siteConfig.metatags.faq.title,
  description: siteConfig.metatags.faq.desc,
  alternates: { canonical: "/faq" }
}

export default function FaqPage() {
  return (
    <>
      <FaqContent />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  )
}
