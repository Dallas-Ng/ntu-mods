import { Metadata } from "next"

import { siteConfig } from "@/config/site"

interface Props {
  children?: React.ReactNode
}

export const metadata: Metadata = {
  title: siteConfig.metatags.screenshot.title,
  description: siteConfig.metatags.screenshot.desc
}

const Layout = ({ children }: Props) => {
  return <>{children}</>
}

export default Layout
