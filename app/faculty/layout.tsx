import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.faculty.title,
  description: siteConfig.metatags.faculty.desc
}

interface Props {
  children?: React.ReactNode
}

export default function Layout({ children }: Props) {
  return <LayoutDefault>{children}</LayoutDefault>
}
