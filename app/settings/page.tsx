"use client"

import dynamic from "next/dynamic"

import { Card, CardContent } from "@/components/ui/card"
import { AppearanceSettingsSkeleton } from "@/components/settings/appearance-settings"
import Feedback from "@/components/settings/feedback"
import { TableSettingsSkeleton } from "@/components/settings/table-settings"

const AppearanceSettings = dynamic(
  () => import("@/components/settings/appearance-settings"),
  {
    ssr: false,
    loading: () => <AppearanceSettingsSkeleton />
  }
)

const TableSettings = dynamic(
  () => import("@/components/settings/table-settings"),
  {
    ssr: false,
    loading: () => <TableSettingsSkeleton />
  }
)

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl p-3">
      <Card className="p-0">
        <CardContent className="flex flex-col gap-6 p-3">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Settings</h1>

            <p>We are building more customisability into the page!</p>

            <hr />
          </div>

          <div className="flex flex-col justify-center gap-3">
            <div>
              <p>Appearance Settings</p>

              <p className="text-sm text-gray-500">
                Customize the appearance of the app. Switch between day and
                night themes.
              </p>
            </div>

            <AppearanceSettings />

            <div>
              <p className="mt-5">Table Settings</p>

              <p className="text-sm text-gray-500">
                Customize the appearance of the stars table.
              </p>
            </div>

            <TableSettings />
          </div>

          <div>
            <Feedback />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
