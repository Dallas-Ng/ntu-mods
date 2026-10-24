"use client"

import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"
import { ExternalLinkIcon } from "@/components/ui/text-link"

interface LinkCardProps {
  name: string
  href: string
  desc: string
  external: boolean
  category: string
}

const LinkCard = ({ name, href, desc, external, category }: LinkCardProps) => {
  const className = cn(
    cardVariants({ interactive: true }),
    "flex h-28 items-start justify-between gap-2 p-4"
  )
  const inner = (
    <>
      <div className="min-w-0 space-y-1">
        <p className="leading-none font-semibold">{name}</p>
        <p className="text-muted-foreground line-clamp-3 text-sm">{desc}</p>
      </div>
      {external && <ExternalLinkIcon className="mt-0.5" />}
    </>
  )

  const handleClick = () =>
    track("link_clicked", {
      link_name: name,
      link_category: category,
      is_external: external
    })

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={handleClick}>
        {inner}
      </a>
    )
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {inner}
    </a>
  )
}

export default LinkCard
