"use client"

import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import TableSettings from "@/components/settings/table-settings"

const TimetableSettingsDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="size-4" />
          <span className="sr-only">Table settings</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Table Settings</DialogTitle>
          <DialogDescription>
            Customise the appearance of the timetable table.
          </DialogDescription>
        </DialogHeader>

        <TableSettings toggleBorder />
      </DialogContent>
    </Dialog>
  )
}

export default TimetableSettingsDialog
