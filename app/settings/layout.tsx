import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.settings.title,
  description: siteConfig.metatags.settings.desc,
  alternates: { canonical: "/settings" }
}

interface Props {
  children?: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="bg-slate-100 dark:bg-slate-950">
      <LayoutDefault size="sm">{children}</LayoutDefault>
    </div>
  )
}
