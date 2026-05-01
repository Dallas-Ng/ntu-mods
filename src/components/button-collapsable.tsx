import { LucideIcon } from "lucide-react"

import { Button } from "./ui/button"

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode
  icon: LucideIcon
}

const ButtonCollapsable = ({ text, icon: Icon, ...rest }: Props) => {
  return (
    <Button
      variant="outline"
      className="size-9 min-w-10 p-0 md:w-fit md:px-4 md:py-2"
      {...rest}>
      <span className="hidden md:mr-1 md:block">{text}</span>
      <Icon className="size-4" />
    </Button>
  )
}

export default ButtonCollapsable
