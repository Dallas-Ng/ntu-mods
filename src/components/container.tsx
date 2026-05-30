import { cn } from "@/lib/utils"

type Size = "full" | "md" | "sm"

const SIZE_CLASSES: Record<Size, string> = {
  full: "container",
  md: "mx-auto max-w-[66rem] py-4 sm:py-6",
  sm: "mx-auto max-w-3xl py-4 sm:py-6"
}

interface Props {
  size?: Size
  children: React.ReactNode
  className?: string
}

const Container = ({ size = "full", children, className }: Props) => (
  <div className={cn(SIZE_CLASSES[size], className)}>{children}</div>
)

export default Container
