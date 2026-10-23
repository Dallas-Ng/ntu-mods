"use client"

import { Bell } from "lucide-react"

import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { useChangelogUnseenCount } from "@/hooks/use-changelog-unseen"
import { usePathname } from "@/hooks/use-pathname"
import { NewBadge } from "@/components/new-dot"

import { NAV_ICON } from "./nav-actions"
import { Button } from "./ui/button"

const ChangelogButton = () => {
  const unseen = useChangelogUnseenCount()
  const pathname = usePathname()

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        NAV_ICON,
        "relative",
        pathname === "/changelog" && "text-foreground"
      )}
      aria-label={
        unseen > 0 ? `Changelog, ${unseen} new updates` : "Changelog"
      }>
      <a
        href="/changelog"
        onClick={() => track("changelog_opened", { source: "navbar_icon" })}>
        <Bell className="size-5" />
        {unseen > 0 && (
          <NewBadge className="absolute -top-1 -right-1 h-4 min-w-4 px-1">
            {unseen > 9 ? "9+" : unseen}
          </NewBadge>
        )}
      </a>
    </Button>
  )
}

export default ChangelogButton
