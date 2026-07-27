"use client"

import { ExternalLink } from "lucide-react"
import posthog from "posthog-js"

interface LinkCardProps {
  name: string
  href: string
  desc: string
  external: boolean
  category: string
}

const LinkCard = ({ name, href, desc, external, category }: LinkCardProps) => {
  const className =
    "border-border hover:bg-accent flex items-start justify-between gap-2 rounded-lg border p-4 transition-colors"
  const inner = (
    <>
      <div className="min-w-0 space-y-1">
        <p className="leading-none font-semibold">{name}</p>
        <p className="text-muted-foreground text-sm">{desc}</p>
      </div>
      {external && (
        <ExternalLink className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      )}
    </>
  )

  const handleClick = () =>
    posthog.capture("link_clicked", {
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
