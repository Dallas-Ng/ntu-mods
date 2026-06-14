import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.exams.title,
  description: siteConfig.metatags.exams.desc,
  alternates: { canonical: "/exams" }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutDefault>{children}</LayoutDefault>
}
