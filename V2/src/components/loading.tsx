import { Loader2 } from "lucide-react"

interface LoadingProps {
  loading?: boolean
}

export default function Loading({ loading = true }: LoadingProps) {
  if (!loading) return <></>

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
    </div>
  )
}
