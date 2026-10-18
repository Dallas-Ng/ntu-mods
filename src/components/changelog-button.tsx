"use client"

import { Megaphone } from "lucide-react"

import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { useChangelogUnseenCount } from "@/hooks/use-changelog-unseen"

import { Button } from "./ui/button"

const ChangelogButton = () => {
  const unseen = useChangelogUnseenCount()

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={
        unseen > 0 ? `Changelog, ${unseen} new updates` : "Changelog"
      }>
      <a
        href="/changelog"
        onClick={() => track("changelog_opened", { source: "navbar_icon" })}>
        <Megaphone className="size-5" />
        {unseen > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-semibold text-black"
            )}>
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </a>
    </Button>
  )
}

export default ChangelogButton
