import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.bde.title,
  description: siteConfig.metatags.bde.desc,
  keywords: [...siteConfig.metatags.bde.keywords],
  alternates: { canonical: "/bde" }
}

interface Props {
  children?: React.ReactNode
}

export default function Layout({ children }: Props) {
  return <LayoutDefault>{children}</LayoutDefault>
}
