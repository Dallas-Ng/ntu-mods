"use client"

import type { ReactNode } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { InlineCode } from "@/components/ui/inline-code"
import {
  ModalFooter,
  ModalNote,
  ModalSection
} from "@/components/ui/modal-parts"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLinkIcon, TextLink } from "@/components/ui/text-link"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  onDownload: () => void
  /**
   * A feed to subscribe to instead of a file to import. The dialog then leads
   * with the link and gives each app's subscribe steps; the download stays as a
   * one-off copy.
   */
  feedUrl?: string
  description?: string
  /** "What you get", when it is not the timetable file. */
  whatYouGet?: ReactNode
  note?: ReactNode
  onSubscribe?: () => void
  onCopied?: () => void
}

const APPS = [
  {
    name: "Google Calendar",
    short: "Google",
    steps:
      "On a computer, open Settings, then Import & export. Choose the file, pick a calendar, and select Import.",
    href: "https://support.google.com/calendar/answer/37118",
    link: "Google's import guide"
  },
  {
    name: "Apple Calendar",
    short: "Apple",
    steps:
      "On an iPhone, iPad or Mac, open the downloaded file and choose Add All. You can pick a calendar first.",
    href: "https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac",
    link: "Apple's import guide"
  },
  {
    name: "Outlook",
    short: "Outlook",
    steps:
      "On the web, choose Add calendar, then Upload from file. In the desktop app, use File, Open & Export, Import/Export.",
    href: "https://support.microsoft.com/en-us/office/import-calendars-into-outlook-8e8364e1-400e-4c0f-a573-fe76b5a2d379",
    link: "Microsoft's import guide"
  }
]

const SUBSCRIBE_STEPS = [
  {
    name: "Google Calendar",
    short: "Google",
    steps:
      "On a computer, select the plus next to Other calendars, choose From URL, paste the link and select Add calendar.",
    href: "https://support.google.com/calendar/answer/37100",
    link: "Google's subscribe guide"
  },
  {
    name: "Apple Calendar",
    short: "Apple",
    steps:
      "Select Open in calendar app, or on a Mac choose File, New Calendar Subscription and paste the link.",
    href: "https://support.apple.com/guide/calendar/subscribe-to-calendars-icl1022/mac",
    link: "Apple's subscribe guide"
  },
  {
    name: "Outlook",
    short: "Outlook",
    steps:
      "On the web, choose Add calendar, then Subscribe from web, and paste the link.",
    href: "https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web-cff1429c-5af6-41ec-a5b4-74f2c278e98c",
    link: "Microsoft's subscribe guide"
  }
]

// Shown before the .ics download, so a student knows what the file is and
// how to get it into their calendar app.
const TimetableCalendarDialog = ({
  open,
  onOpenChange,
  loading,
  onDownload,
  feedUrl,
  description = "Download your timetable as a calendar file, then open it in your calendar app.",
  whatYouGet,
  note,
  onSubscribe,
  onCopied
}: Props) => {
  const apps = feedUrl ? SUBSCRIBE_STEPS : APPS
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      nested={false}
      title="Add to your calendar"
      showDescription
      description={description}
      className="max-h-[90vh] sm:max-w-lg"
      footer={
        <ModalFooter className="pt-0">
          <Button
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={feedUrl ? "outline" : "default"}
            disabled={loading}
            onClick={() => {
              onOpenChange(false)
              onDownload()
            }}>
            Download .ics
          </Button>
          {feedUrl && (
            <a
              href={feedUrl.replace(/^https?:/, "webcal:")}
              onClick={() => {
                onSubscribe?.()
                onOpenChange(false)
              }}
              className={buttonVariants()}>
              Open in calendar app
            </a>
          )}
        </ModalFooter>
      }>
      <div className="space-y-5">
        <ModalSection title="What you get">
          <p className="text-muted-foreground text-sm">
            {whatYouGet ?? (
              <>
                An <InlineCode>.ics</InlineCode> file with one event for every
                class, on each week it runs, with its venue. Dates come from the
                NTU academic calendar: classes on public holidays are left out,
                and recess, exam weeks and holidays are marked. It works with
                any calendar app.
              </>
            )}
          </p>
        </ModalSection>

        {feedUrl && (
          <ModalSection title="Calendar link">
            <div className="bg-muted flex items-center gap-2 rounded-lg py-1.5 pr-1.5 pl-3">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">
                {feedUrl}
              </span>
              <CopyButton value={feedUrl} label onCopied={onCopied} />
            </div>
          </ModalSection>
        )}

        <ModalSection title={feedUrl ? "How to subscribe" : "How to add it"}>
          <Tabs defaultValue={apps[0].name} className="gap-3">
            <TabsList className="grid w-full grid-cols-3">
              {apps.map((app) => (
                <TabsTrigger key={app.name} value={app.name}>
                  {app.short}
                </TabsTrigger>
              ))}
            </TabsList>
            {apps.map((app) => (
              <TabsContent
                key={app.name}
                value={app.name}
                className="bg-muted space-y-1.5 rounded-lg p-3 text-sm">
                <p className="font-medium">{app.name}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {app.steps}
                </p>
                <TextLink
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs">
                  {app.link}
                  <ExternalLinkIcon className="size-3 text-current" />
                </TextLink>
              </TabsContent>
            ))}
          </Tabs>
        </ModalSection>

        <ModalNote>
          {note ?? (
            <>
              The file is a snapshot. If you change your plan later, the
              calendar does not update, so delete the old events and import
              again. Importing into a new calendar makes them easy to remove.
            </>
          )}
        </ModalNote>
      </div>
    </ResponsiveModal>
  )
}

export default TimetableCalendarDialog
