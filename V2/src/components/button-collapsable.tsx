import { LucideIcon } from "lucide-react"

import { Button } from "./ui/button"

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode
  icon: LucideIcon
}

const ButtonCollapsable = (props: Props) => {
  const { text, icon: Icon } = props

  return (
    <Button
      variant="outline"
      className="h-9 w-9 p-0 md:w-fit md:px-4 md:py-2"
      {...props}>
      <span className="hidden md:mr-1 md:block">{text}</span>
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export default ButtonCollapsable
