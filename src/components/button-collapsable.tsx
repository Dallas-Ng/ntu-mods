import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./ui/button"

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode
  icon: LucideIcon
  /** Keep the text on phones too, for first-time visitors. */
  labelled?: boolean
}

const ButtonCollapsable = ({
  text,
  icon: Icon,
  labelled,
  className,
  ...rest
}: Props) => {
  return (
    <Button
      variant="outline"
      className={cn(
        labelled ? "gap-2" : "size-9 min-w-10 p-0 md:w-fit md:px-4 md:py-2",
        className
      )}
      // The text is display:none below md, which leaves icon-only buttons
      // with no accessible name.
      aria-label={typeof text === "string" ? text : undefined}
      {...rest}>
      <span className={cn(!labelled && "hidden md:mr-1 md:block")}>{text}</span>
      <Icon className="size-4" />
    </Button>
  )
}

export default ButtonCollapsable
