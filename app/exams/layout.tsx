import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.exams.title,
  description: siteConfig.metatags.exams.desc,
  keywords: [...siteConfig.metatags.exams.keywords],
  alternates: { canonical: "/exams" },
  openGraph: {
    title: siteConfig.metatags.exams.title,
    description: siteConfig.metatags.exams.desc,
    url: `${siteConfig.url}/exams`,
    type: "website",
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }]
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutDefault>{children}</LayoutDefault>
}
