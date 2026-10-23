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
  /** See ResponsiveModal: false when opened from the page, not a drawer. */
  nested?: boolean
}

/** Asks before an action the user cannot undo. Use instead of confirm(). */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  nested = false
}: Props) => (
  <ResponsiveModal
    open={open}
    onOpenChange={onOpenChange}
    nested={nested}
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
