import { useBoundState } from "@/state/bound-state"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

interface Props {
  trigger: React.ReactNode
  content: React.ReactNode
  openChange?: (open: boolean) => void
  contentClassName?: string
}

function DrawerDialog(props: Props) {
  const { trigger, content, openChange, contentClassName } = props
  const { info } = useBoundState()

  const handleOpenChange = (open: boolean) => {
    if (openChange !== undefined) {
      openChange(open)
    }
  }

  if (info.mobile) {
    return (
      <Drawer closeThreshold={0.7} onOpenChange={handleOpenChange}>
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
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger type={undefined} asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="h-[600px] max-w-3xl">{content}</DialogContent>
    </Dialog>
  )
}

export { DrawerDialog }
