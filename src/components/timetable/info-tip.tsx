"use client"

import { Info } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

// Small "i" after a title: hover says what it is for.
const InfoTip = ({
  title,
  children
}: {
  title?: string
  children: React.ReactNode
}) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={title ? `About ${title}` : "More information"}
          className="text-muted-foreground hover:text-foreground pointer-events-auto ml-1.5 inline-flex cursor-help transition-colors">
          <Info className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-center">
        {title && <p className="font-medium">{title}</p>}
        <p className="text-xs opacity-80">{children}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export default InfoTip
