import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface LoadingProps {
  loading?: boolean
  divClassName?: React.ComponentProps<"div">["className"]
  iconClassName?: React.ComponentProps<"div">["className"]
}

export default function Loading({
  loading = true,
  divClassName,
  iconClassName
}: LoadingProps) {
  if (!loading) return <></>

  return (
    <div className={cn("flex items-center justify-center", divClassName)}>
      <Loader2 className={cn("h-10 w-10 animate-spin", iconClassName)} />
    </div>
  )
}
