import dynamic from "next/dynamic"
import Link from "next/link"

import { Button } from "@/components/ui/button"
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
    <div className="mx-auto max-w-2xl rounded-md border bg-card pb-2 shadow-lg">
      <div className="flex flex-col gap-6 p-3">
        <div className="flex w-full flex-col gap-3">
          <h1 className="text-3xl font-bold">Settings</h1>

          <p className="text-muted-foreground">
            We are building more customisability into the page!
          </p>

          <hr />

          <Link href="/debug">
            <Button
              className="text-sm text-muted-foreground"
              variant="outline"
              size="sm">
              Clear my data
            </Button>
          </Link>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div>
            <p>Appearance Settings</p>

            <p className="text-sm text-muted-foreground">
              Customize the appearance of the app. Switch between day and night
              themes.
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
    </div>
  )
}
