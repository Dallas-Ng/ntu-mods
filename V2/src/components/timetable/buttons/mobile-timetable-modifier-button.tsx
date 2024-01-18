import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

import TimetableModifier from "../timetable-modifier"

const MobileTimetableModifierButton = () => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="flex h-full w-full items-center justify-center bg-primary">
          Click to Edit Modules
        </div>
      </DrawerTrigger>

      <DrawerContent className="h-[70vh] p-2">
        <TimetableModifier />
      </DrawerContent>
    </Drawer>
  )
}

export default MobileTimetableModifierButton
