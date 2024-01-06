"use client"

import DrawerPopover from "@/components/drawer-popover"

import IndexCommand from "./index-command"
import useIndexLogic from "./index-logic"

interface Props {
  courseKey: string
  trigger: React.ReactNode
}

export default function StarsIndexButton({ courseKey, trigger }: Props) {
  /**
   * This component is needed as if you move useIndexLogic into a loop, it breaks
   */
  const indexProps = useIndexLogic({ courseKey })
  const { handleSearch } = indexProps

  return (
    <>
      <DrawerPopover
        contentClassName="h-[70vh]"
        openChange={(open) => (open ? handleSearch("") : {})}
        trigger={trigger}
        content={
          <IndexCommand
            {...indexProps}
            commandClassName="md:max-h-[450px] overflow-auto"
          />
        }
      />
    </>
  )
}
