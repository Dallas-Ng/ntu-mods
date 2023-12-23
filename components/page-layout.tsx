import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  containerClassName?: React.HTMLAttributes<HTMLDivElement>["className"]
}

export default function PageLayout({ children, containerClassName }: Props) {
  return (
    <div className={cn("container p-5", containerClassName)}>
      <>{children}</>
    </div>
  )
}
