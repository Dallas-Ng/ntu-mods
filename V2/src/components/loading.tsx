import { Loader2 } from "lucide-react"

interface LoadingProps {
  loading?: boolean
}

export default function Loading({ loading = true }: LoadingProps) {
  if (!loading) return <></>

  return (
    <div className="flex size-full items-center justify-center">
      <Loader2 className="size-10 animate-spin text-secondary" />
    </div>
  )
}
