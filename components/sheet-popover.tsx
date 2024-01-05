import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface Props {
  triggerComponent: React.ReactNode
  popoverContent: React.ReactNode
  sheetContent: React.ReactNode
  openChange?: (open: boolean) => void
  mock?: boolean
}

export default function SheetPopover(props: Props) {
  const {
    triggerComponent,
    popoverContent,
    sheetContent,
    openChange,
    mock = false
  } = props

  const mobile = useMediaQuery("(max-width: 768px)")

  const handleOpenChange = (open: boolean) => {
    if (openChange !== undefined) {
      openChange(open)
    }
  }

  if (mobile) {
    return (
      <Sheet onOpenChange={handleOpenChange} open={mock ? false : undefined}>
        <SheetTrigger type={undefined} asChild>
          {triggerComponent}
        </SheetTrigger>

        <SheetContent className="flex h-screen w-[90vw] max-w-md flex-col px-2 py-4">
          {sheetContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={mock ? false : undefined}>
      <PopoverTrigger asChild type={undefined}>
        {triggerComponent}
      </PopoverTrigger>

      <PopoverContent sideOffset={4} className="p-0 md:w-96">
        {popoverContent}
      </PopoverContent>
    </Popover>
  )
}
