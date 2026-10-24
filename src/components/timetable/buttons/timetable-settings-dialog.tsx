"use client"

import { ResponsiveModal } from "@/components/ui/responsive-modal"
import TableSettings from "@/components/settings/table-settings"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TimetableSettingsDialog = ({ open, onOpenChange }: Props) => {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      nested={false}
      title="Table settings"
      showDescription
      description="Customise the appearance of the timetable table."
      className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
      <TableSettings toggleBorder />
    </ResponsiveModal>
  )
}

export default TimetableSettingsDialog
