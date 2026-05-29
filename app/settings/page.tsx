"use client"

import dynamic from "next/dynamic"

import { SUPPORT_PAGE_CONTAINER_CLASSNAME } from "@/lib/constants"
import { cn } from "@/lib/utils"
import FeedbackCard from "@/components/feedback-card"
import Header from "@/components/header"
import { AppearanceSettingsLoading } from "@/components/settings/appearance-settings"
import { TableSettingsLoading } from "@/components/settings/table-settings"

const AppearanceSettings = dynamic(
  () => import("@/components/settings/appearance-settings"),
  {
    ssr: false,
    loading: () => <AppearanceSettingsLoading />
  }
)

const TableSettings = dynamic(
  () => import("@/components/settings/table-settings"),
  {
    ssr: false,
    loading: () => <TableSettingsLoading />
  }
)

export default function SettingsPage() {
  return (
    <div className={cn(SUPPORT_PAGE_CONTAINER_CLASSNAME, "space-y-4")}>
      <Header
        title="Settings"
        subtitle="Customise the look, feel, and timetable detail level."
      />

      <div className="space-y-5">

        <div
          id="dark-mode"
          className="bg-card space-y-4 rounded-md border px-4 pt-2 pb-4 shadow-lg">
          <div>
            <p>Appearance Settings</p>

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
            <p>Table Settings</p>

            <p className="text-muted-foreground text-sm">
              Customize the appearance of the stars table.
            </p>
          </div>

          <hr />

          <TableSettings />
        </div>

        <div
          id="feedback"
          className="bg-card space-y-2 rounded-md border px-4 pt-2 pb-4 shadow-lg">
          <div>
            <p>Feedback </p>

            <p className="text-muted-foreground text-sm">
              Let us know of any problems or suggestions you have!
            </p>
          </div>

          <FeedbackCard divClassName="border-none p-0 mt-5" />
        </div>
      </div>
    </div>
  )
}
