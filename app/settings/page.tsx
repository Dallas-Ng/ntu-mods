import dynamic from "next/dynamic"
import Link from "next/link"
import { History, ServerCrash } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import FeedbackCard from "@/components/feedback-card"
import Header from "@/components/header"
import { AppearanceSettingsLoading } from "@/components/settings/appearance-settings"
import { BetaSettingsLoading } from "@/components/settings/beta-settings"
import { TableSettingsLoading } from "@/components/settings/table-settings"

const BetaSettings = dynamic(
  () => import("@/components/settings/beta-settings"),
  { ssr: false, loading: () => <BetaSettingsLoading /> }
)

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
    <div className="mx-auto max-w-4xl space-y-4 lg:mt-5">
      <Header
        title="Settings"
        subtitle="Customise the look, feel, and timetable detail level."
      />

      <div className="space-y-5">
        <div>
          <Link href="/debug">
            <Alert className="border-2 transition-colors hover:bg-muted">
              <ServerCrash className="size-5" />

              <AlertTitle>Having Problems with the System?</AlertTitle>

              <AlertDescription>
                Click here if you need to reset the application
              </AlertDescription>
            </Alert>
          </Link>
        </div>

        <div
          id="dark-mode"
          className="space-y-4 rounded-md border bg-card px-4 pb-4 pt-2 shadow-lg">
          <div>
            <p>Appearance Settings</p>

            <p className="text-sm text-muted-foreground">
              Tune theme, radius, density, contrast, and timetable colour
              personality.
            </p>
          </div>

          <hr />

          <AppearanceSettings />
        </div>

        <div
          id="table-settings"
          className="space-y-4 rounded-md border bg-card px-4 pb-4 pt-2 shadow-lg">
          <div>
            <p>Table Settings</p>

            <p className="text-sm text-muted-foreground">
              Customize the appearance of the stars table.
            </p>
          </div>

          <hr />

          <TableSettings />
        </div>

        <div
          id="beta"
          className="space-y-4 rounded-md border bg-card px-4 pb-4 pt-2 shadow-lg">
          <div>
            <p>Beta Settings</p>

            <p className="text-sm text-muted-foreground">
              Opt in for beta updates, see new content before we release it!
            </p>
          </div>

          <hr />

          <BetaSettings />
        </div>

        <div
          id="feedback"
          className="space-y-2 rounded-md border bg-card px-4 pb-4 pt-2 shadow-lg">
          <div>
            <p>Feedback </p>

            <p className="text-sm text-muted-foreground">
              Let us know of any problems or suggestions you have!
            </p>
          </div>

          <FeedbackCard divClassName="border-none p-0 mt-5" />
        </div>

        <Link href="/changelog" className="block">
          <Alert className="border-2 transition-colors hover:bg-muted">
            <History className="size-5" />

            <AlertTitle>See what changed recently</AlertTitle>

            <AlertDescription>
              View the latest NTU Mods features, fixes, and data updates.
            </AlertDescription>
          </Alert>
        </Link>
      </div>
    </div>
  )
}
