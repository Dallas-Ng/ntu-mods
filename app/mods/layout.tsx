import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.mods.title,
  description: siteConfig.metatags.mods.desc
}

interface Props {
  children?: React.ReactNode
}

export default function Layout({ children }: Props) {
  return <LayoutDefault>{children}</LayoutDefault>
}
