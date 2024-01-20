"use client"

import { usePathname } from "next/navigation"

import RelatedModules from "../related-modules"

/**
 * Component that shows related modules on the mods page
 * Needs it's own file as its a client component
 */
const ModsNotFoundRelatedMods = () => {
  const pathname = usePathname()
  const moduleKey = pathname.split("/")[2]

  return <RelatedModules moduleKey={moduleKey} />
}

export default ModsNotFoundRelatedMods
