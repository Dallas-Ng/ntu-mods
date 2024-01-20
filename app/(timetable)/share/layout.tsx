import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

interface Props {
  children?: React.ReactNode
}

export const metadata: Metadata = {
  title: siteConfig.metatags.share.title,
  description: siteConfig.metatags.share.desc
}

const Layout = ({ children }: Props) => {
  return <LayoutDefault>{children}</LayoutDefault>
}

export default Layout
