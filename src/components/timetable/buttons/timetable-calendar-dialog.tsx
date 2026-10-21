"use client"

import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ResponsiveModal } from "@/components/ui/responsive-modal"

import { ModalFooter, ModalNote, ModalSection } from "./modal-parts"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  onDownload: () => void
}

const APPS = [
  {
    name: "Google Calendar",
    steps:
      "On a computer, open Settings, then Import & export. Choose the file, pick a calendar, and select Import.",
    href: "https://support.google.com/calendar/answer/37118",
    link: "Google's import guide"
  },
  {
    name: "Apple Calendar",
    steps:
      "On an iPhone, iPad or Mac, open the downloaded file and choose Add All. You can pick a calendar first.",
    href: "https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac",
    link: "Apple's import guide"
  },
  {
    name: "Outlook",
    steps:
      "On the web, choose Add calendar, then Upload from file. In the desktop app, use File, Open & Export, Import/Export.",
    href: "https://support.microsoft.com/en-us/office/import-calendars-into-outlook-8e8364e1-400e-4c0f-a573-fe76b5a2d379",
    link: "Microsoft's import guide"
  }
]

// Shown before the .ics download, so a student knows what the file is and
// how to get it into their calendar app.
const TimetableCalendarDialog = ({
  open,
  onOpenChange,
  loading,
  onDownload
}: Props) => (
  <ResponsiveModal
    open={open}
    onOpenChange={onOpenChange}
    nested={false}
    title="Add to your calendar"
    showDescription
    description="Download your timetable as a calendar file, then open it in your calendar app."
    className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <div className="space-y-5">
      <ModalSection title="What you get">
        <p className="text-muted-foreground text-sm">
          An <code className="text-foreground">.ics</code> file with one event
          for every class, on each week it runs, with its venue. Recess week is
          skipped. It works with any calendar app.
        </p>
      </ModalSection>

      <ModalSection title="How to add it">
        <div className="divide-y rounded-lg border">
          {APPS.map((app) => (
            <div key={app.name} className="space-y-1 p-3 text-sm">
              <p className="font-medium">{app.name}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {app.steps}
              </p>
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-xs underline underline-offset-2">
                {app.link}
                <ExternalLink className="size-3" />
              </a>
            </div>
          ))}
        </div>
      </ModalSection>

      <ModalNote>
        The file is a snapshot. If you change your plan later, the calendar does
        not update, so delete the old events and import again. Importing into a
        new calendar makes them easy to remove.
      </ModalNote>

      <ModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          disabled={loading}
          onClick={() => {
            onOpenChange(false)
            onDownload()
          }}>
          Download .ics
        </Button>
      </ModalFooter>
    </div>
  </ResponsiveModal>
)

export default TimetableCalendarDialog
