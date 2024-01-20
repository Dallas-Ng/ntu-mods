import { Settings } from "lucide-react"

import AppearanceSettings from "../settings/appearance-settings"
import TableSettings from "../settings/table-settings"
import { Button } from "../ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/drawer"

const ScreenshotSettingsButton = () => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="size-5" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[100svh]">
        <div className="space-y-5 p-5">
          <AppearanceSettings />

          <TableSettings toggleBorder />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export const ScreenshotSettingsButtonLoader = () => (
  <Button variant="outline" size="icon" disabled>
    <Settings className="size-5" />
  </Button>
)

export default ScreenshotSettingsButton
