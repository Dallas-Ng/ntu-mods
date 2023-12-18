import dynamic from "next/dynamic"

import Loading from "@/components/loading"

const DebugContent = dynamic(() => import("@/components/debug-content"), {
  ssr: false,
  loading: () => <Loading divClassName="h-[70vh] w-full" /> // update this
})

export default function DebugPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="bg-gradient-to-r from-emerald-500 to-emerald-900 bg-clip-text  text-3xl font-bold text-transparent">
        Debug Page
      </h1>

      <DebugContent />
    </div>
  )
}
