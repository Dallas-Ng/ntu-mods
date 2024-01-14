import { Settings } from "lucide-react"

import AppearanceSettings from "../settings/appearance-settings"
import TableSettings from "../settings/table-settings"
import { Button } from "../ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/drawer"

export default function ScreenshotSettingsButton() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="space-y-5 p-5">
          <AppearanceSettings />

          <TableSettings toggleBorder />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
