import dynamic from "next/dynamic"

import Loading from "@/components/loading"

const DebugContent = dynamic(() => import("@/components/debug-content"), {
  ssr: false,
  loading: () => <Loading divClassName="h-[70vh] w-full" /> // update this
})

export default function DebugPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="bg-gradient-to-r from-rose-700 to-red-900 bg-clip-text text-3xl font-bold text-transparent">
        Debug Page
      </h1>

      {/* <div className="flex gap-2">
        <div className="h-[50px] w-[50px] bg-background"></div>
        <div className="h-[50px] w-[50px] bg-foreground"></div>
        <div className="h-[50px] w-[50px] bg-primary"></div>
        <div className="h-[50px] w-[50px] bg-secondary-foreground"></div>
        <div className="h-[50px] w-[50px] bg-secondary"></div>
        <div className="h-[50px] w-[50px] bg-muted-foreground"></div>
        <div className="h-[50px] w-[50px] bg-muted"></div>
        <div className="h-[50px] w-[50px] bg-accent"></div>
      </div> */}

      <DebugContent />
    </div>
  )
}
