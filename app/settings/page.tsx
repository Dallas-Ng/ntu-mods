import dynamic from "next/dynamic"
import Link from "next/link"
import { ServerCrash } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
    <div className="mx-auto max-w-2xl space-y-4 md:mt-5">
      <Header title="Settings" subtitle="Customise the website!" />

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

        <div className="flex flex-col gap-6 rounded-md border bg-card p-3 pb-5 shadow-lg">
          <div className="flex flex-col justify-center gap-3">
            <div>
              <p>Appearance Settings</p>

              <p className="text-sm text-muted-foreground">
                Customize the appearance of the app. Switch between day and
                night themes.
              </p>
            </div>

            <AppearanceSettings />

            <div>
              <p className="mt-5">Table Settings</p>

              <p className="text-sm text-muted-foreground">
                Customize the appearance of the stars table.
              </p>
            </div>

            <TableSettings />
          </div>
        </div>

        <div
          id="feedback"
          className="flex flex-col rounded-md border bg-card p-5 shadow-lg">
          <div>
            <p>Feedback </p>

            <p className="text-sm text-muted-foreground">
              Let us know of any problems or suggestions you have!
            </p>
          </div>

          <FeedbackCard divClassName="border-none p-0 mt-5" />
        </div>
      </div>
    </div>
  )
}
