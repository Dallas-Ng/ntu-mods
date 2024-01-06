import { useBoundState } from "@/state/bound-state"

import { cn } from "@/lib/utils"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

interface Props {
  trigger: React.ReactNode
  content: React.ReactNode
  openChange?: (open: boolean) => void
  onClose?: () => void
  contentClassName?: string
}

export default function DrawerPopover(props: Props) {
  const { trigger, content, openChange, onClose, contentClassName } = props
  const { info } = useBoundState()

  const handleOpenChange = (open: boolean) => {
    if (openChange !== undefined) {
      openChange(open)
    }
  }

  if (info.mobile) {
    return (
      <Drawer
        closeThreshold={0.7}
        onOpenChange={handleOpenChange}
        onClose={onClose}>
        <DrawerTrigger type={undefined} asChild>
          {trigger}
        </DrawerTrigger>

        <DrawerContent className={cn("h-[80vh]", contentClassName)}>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger type={undefined} asChild>
        {trigger}
      </PopoverTrigger>

      <PopoverContent className={contentClassName}>{content}</PopoverContent>
    </Popover>
  )
}
