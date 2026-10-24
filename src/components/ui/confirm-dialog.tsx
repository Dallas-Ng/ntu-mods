"use client"

import { Button } from "@/components/ui/button"
import { ModalFooter } from "@/components/ui/modal-parts"
import { ResponsiveModal } from "@/components/ui/responsive-modal"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description: React.ReactNode
  confirmLabel: string
  /** Red confirm button, for actions that replace or delete data. */
  destructive?: boolean
  onConfirm: () => void
}

/** Asks before an action the user cannot undo. Use instead of confirm(). */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm
}: Props) => (
  <ResponsiveModal
    open={open}
    onOpenChange={onOpenChange}
    nested={false}
    title={title}
    description={description}
    showDescription
    className="sm:max-w-sm">
    <ModalFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button
        variant={destructive ? "destructive" : "default"}
        onClick={() => {
          onConfirm()
          onOpenChange(false)
        }}>
        {confirmLabel}
      </Button>
    </ModalFooter>
  </ResponsiveModal>
)
