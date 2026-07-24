"use client"

import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import AppearanceSettings from "@/components/settings/appearance-settings"
import TableSettings from "@/components/settings/table-settings"

const SettingsPageContent = () => {
  return (
    <div className="space-y-4">
      <Header
        title="Settings"
        subtitle="Customise the look, feel, and timetable detail level."
      />

      <div className="space-y-5">
        <div
          id="dark-mode"
          className="bg-card space-y-4 rounded-md border px-4 pt-2 pb-4 shadow-lg">
          <div>
            <p className="font-medium">Appearance</p>

            <p className="text-muted-foreground text-sm">
              Tune theme, radius, density, contrast, and timetable colour
              personality.
            </p>
          </div>

          <hr />

          <AppearanceSettings />
        </div>

        <div
          id="table-settings"
          className="bg-card space-y-4 rounded-md border px-4 pt-2 pb-4 shadow-lg">
          <div>
            <p className="font-medium">Table Settings</p>

            <p className="text-muted-foreground text-sm">
              Customise the appearance of the timetable table.
            </p>
          </div>

          <hr />

          <TableSettings />
        </div>

        <div
          id="feedback"
          className="bg-card space-y-4 rounded-md border px-4 pt-2 pb-4 shadow-lg">
          <div>
            <p className="font-medium">Feedback</p>

            <p className="text-muted-foreground text-sm">
              Have a problem or suggestion? Let us know.
            </p>
          </div>

          <a href="/feedback">
            <Button variant="outline" className="w-full">
              Share Feedback
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default SettingsPageContent
