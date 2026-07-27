"use client"

import { usePathname } from "@/hooks/use-pathname"
import { Banner } from "@/components/banner"

const HIDDEN_BANNER_PATHS = new Set(["/screenshot"])

const AppBanner = () => {
  const pathname = usePathname()

  if (HIDDEN_BANNER_PATHS.has(pathname)) return null

  return <Banner.performanceUpdate />
}

export default AppBanner
