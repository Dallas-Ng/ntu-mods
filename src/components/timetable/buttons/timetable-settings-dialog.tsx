"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import TableSettings from "@/components/settings/table-settings"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TimetableSettingsDialog = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
