"use client"

import { useMemo, useState } from "react"
import { ClipboardCopy, LinkIcon } from "lucide-react"
import { toast } from "sonner"

import { reportError, track } from "@/lib/analytics"
import { BASE_URL } from "@/lib/constants"
import { buildShareLink, encodeTextBundle } from "@/lib/timetable-share"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Switch } from "@/components/ui/switch"

import { ModalNote, ModalOption, ModalSection } from "./modal-parts"

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
    () =>
      buildShareLink(
        typeof window === "undefined" ? BASE_URL : window.location.origin,
        timetable,
        withCustom
      ),
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
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      nested={false}
      title="Share timetable"
      showDescription
      description={
        <>
          {moduleCount} module{moduleCount !== 1 ? "s" : ""}
          {customCourses.length > 0 &&
            ` · ${customCourses.length} custom block${customCourses.length !== 1 ? "s" : ""}`}
        </>
      }
      className="max-h-[90vh] overflow-y-auto sm:max-w-md">
      <div className="space-y-5">
        {customCourses.length > 0 && (
          <ModalOption
            title="Include custom blocks"
            hint="Your gym, CCA and other personal blocks travel with it.">
            <Switch
              checked={includeCustomBlocks}
              onCheckedChange={setIncludeCustomBlocks}
              aria-label="Include custom blocks"
            />
          </ModalOption>
        )}

        <ModalSection
          title="Link"
          hint="Anyone with the link can open your plan.">
          <Input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Share link"
            className="text-muted-foreground font-mono text-xs"
          />
          {isLinkLong && (
            <ModalNote>
              This link is long and some apps may cut it short. The text code
              below is safer.
            </ModalNote>
          )}
          <Button onClick={handleCopyLink} className="w-full gap-2">
            <LinkIcon className="size-4" />
            Copy link
          </Button>
        </ModalSection>

        <ModalSection
          title="Text code"
          hint="Paste it into Import on another device. It works with any number of custom blocks."
          className="border-t pt-5">
          <Button
            variant="outline"
            onClick={handleCopyText}
            className="w-full gap-2">
            <ClipboardCopy className="size-4" />
            Copy as text
          </Button>
        </ModalSection>
      </div>
    </ResponsiveModal>
  )
}

export default TimetableShareDialog
