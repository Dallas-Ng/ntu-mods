import dynamic from "next/dynamic"

import { IS_DEV } from "@/lib/constants"
import Loading from "@/components/loading"

const DebugContent = dynamic(() => import("@/components/debug/debug-content"), {
  ssr: false,
  loading: () => <Loading />
})

export default function DebugPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="bg-gradient-to-r from-rose-700 to-red-900 bg-clip-text text-3xl font-bold text-transparent">
        Debug Page
      </h1>

      {IS_DEV && (
        <div className="flex gap-2">
          <div className="h-[50px] w-[200px] bg-background">bg-background</div>
          <div className="h-[50px] w-[200px] bg-foreground text-white">
            bg-foreground
          </div>
          <div className="h-[50px] w-[200px] bg-primary">bg-primary</div>
          <div className="h-[50px] w-[200px] bg-secondary-foreground">
            bg-secondary-foreground
          </div>
          <div className="h-[50px] w-[200px] bg-secondary">bg-secondary</div>
          <div className="h-[50px] w-[200px] bg-muted-foreground">
            bg-muted-foreground
          </div>
          <div className="h-[50px] w-[200px] bg-muted">bg-muted</div>
          <div className="h-[50px] w-[200px] bg-accent">bg-accent</div>
        </div>
      )}
      <DebugContent />
    </div>
  )
}
