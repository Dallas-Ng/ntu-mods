import { GraduationCapIcon } from "lucide-react"

import FgoAppLoader from "@/components/fgo/fgo-app-loader"
import LayoutDefault from "@/components/layout-default"

export default function FgoPage() {
  return (
    <LayoutDefault size="md">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <GraduationCapIcon className="size-5" />
          <h1 className="text-2xl font-bold">FGO Analyser</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Upload your NTU degree audit (PDF or screenshot) to find the optimal
          Flexible Grading Option strategy. Everything runs in your browser — no
          data leaves your device.
        </p>
      </div>
      <FgoAppLoader />
    </LayoutDefault>
  )
}
