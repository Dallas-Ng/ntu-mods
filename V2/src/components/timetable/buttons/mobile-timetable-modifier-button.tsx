import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

import TimetableModifier from "../timetable-modifier"

const MobileTimetableModifierButton = () => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="flex size-full items-center justify-center bg-primary text-primary-foreground">
          Click to Edit Modules
        </div>
      </DrawerTrigger>

      <DrawerContent className="h-[90svh] p-2">
        <TimetableModifier />
      </DrawerContent>
    </Drawer>
  )
}

export default MobileTimetableModifierButton
