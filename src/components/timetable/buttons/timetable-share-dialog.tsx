"use client"

import { useMemo, useState } from "react"
import { ClipboardCopy, LinkIcon } from "lucide-react"
import { toast } from "sonner"

import { reportError, track } from "@/lib/analytics"
import { BASE_URL } from "@/lib/constants"
import { buildShareLink, encodeTextBundle } from "@/lib/timetable-share"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

// Chrome's ~2000 char practical ceiling, minus room for the origin
const LINK_LENGTH_WARNING = 1800

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  timetable: Timetable
  customCourses: CustomCourse[]
}

const TimetableShareDialog = ({
  open,
  onOpenChange,
  timetable,
  customCourses
}: Props) => {
  const [includeCustomBlocks, setIncludeCustomBlocks] = useState(true)

  const withCustom = useMemo(
    () => (includeCustomBlocks ? customCourses : []),
    [includeCustomBlocks, customCourses]
  )

  const link = useMemo(
    () => buildShareLink(BASE_URL, timetable, withCustom),
    [timetable, withCustom]
  )

  const textBundle = useMemo(
    () => encodeTextBundle(timetable, withCustom),
    [timetable, withCustom]
  )

  const moduleCount = Object.keys(timetable).length
  const isLinkLong = link.length > LINK_LENGTH_WARNING

  const captureProps = {
    module_count: moduleCount,
    custom_block_count: withCustom.length,
    includes_custom_blocks: withCustom.length > 0
  }

  const handleCopyLink = () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent)

    if (isMobile && navigator.share) {
      track("timetable_shared", {
        method: "native_share",
        ...captureProps
      })
      navigator
        .share({
          title: "Look at my timetable from NTU Mods",
          text: "You can use this to plan your mods too!",
          url: link
        })
        .catch((e) => {
          // AbortError is the user dismissing the share sheet
          if (e?.name !== "AbortError") reportError("timetable_share", e)
          navigator.clipboard.writeText(link)
          toast("Share link copied to clipboard")
        })
      onOpenChange(false)
      return
    }

    track("timetable_shared", {
      method: "clipboard",
      ...captureProps
    })
    navigator.clipboard.writeText(link)
    toast("Share link copied to clipboard")
    onOpenChange(false)
  }

  const handleCopyText = () => {
    track("timetable_shared", { method: "text", ...captureProps })
    navigator.clipboard.writeText(textBundle)
    toast("Timetable code copied — paste it into Import")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share timetable</DialogTitle>
          <DialogDescription>
            {moduleCount} module{moduleCount !== 1 ? "s" : ""}
            {customCourses.length > 0 &&
              ` · ${customCourses.length} custom block${customCourses.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {customCourses.length > 0 && (
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeCustomBlocks}
                onChange={(e) => setIncludeCustomBlocks(e.target.checked)}
                className="mt-0.5 size-3.5"
              />
              <span>
                Include custom blocks
                <span className="text-muted-foreground block text-xs">
                  Your gym, CCA and other personal blocks travel with the link
                </span>
              </span>
            </label>
          )}

          <div className="space-y-2">
            <div className="text-muted-foreground bg-muted/40 max-h-20 overflow-y-auto rounded-md border p-2 text-xs break-all">
              {link}
            </div>

            <Button onClick={handleCopyLink} className="w-full gap-2">
              <LinkIcon className="size-4" />
              Copy link
            </Button>

            {isLinkLong && (
              <p className="text-muted-foreground text-xs">
                This link is long and some apps may cut it short — the text code
                below is safer.
              </p>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-muted-foreground text-xs">
              Or copy a text code that the receiver pastes into Import. Handles
              any number of custom blocks.
            </p>
            <Button
              variant="outline"
              onClick={handleCopyText}
              className="w-full gap-2">
              <ClipboardCopy className="size-4" />
              Copy as text
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TimetableShareDialog
