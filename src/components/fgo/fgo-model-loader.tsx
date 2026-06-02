"use client"

import { BotIcon, CheckCircleIcon, ExternalLinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  isLoading: boolean
  loadingProgress: number
  isReady: boolean
  error: string | null
  onInit: () => void
}

export default function FgoModelLoader({
  isLoading,
  loadingProgress,
  isReady,
  error,
  onInit
}: Props) {
  if (isReady) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500">
        <CheckCircleIcon className="size-3.5" />
        AI model ready — enhanced extraction active
      </div>
    )
  }

  if (error === "webgpu_unsupported") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <BotIcon className="text-muted-foreground size-4" />
          <span className="text-sm font-medium">AI Extraction</span>
        </div>
        <p className="text-muted-foreground text-xs">
          Your browser doesn&apos;t support WebGPU. AI extraction requires
          Chrome or Edge on a recent device.
        </p>
        <p className="text-muted-foreground text-xs">
          You can still use the deterministic parser or paste text manually.
        </p>
        <a
          href="https://caniuse.com/webgpu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline transition-colors">
          WebGPU browser support
          <ExternalLinkIcon className="size-3" />
        </a>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <BotIcon className="text-muted-foreground size-4" />
          <span className="text-sm font-medium">AI Extraction</span>
        </div>
        <p className="text-muted-foreground text-xs">
          Failed to load model: {error}
        </p>
        <Button size="sm" variant="outline" onClick={onInit} className="w-full">
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <BotIcon className="text-muted-foreground size-4 animate-pulse" />
          <span className="text-sm font-medium">Loading AI model…</span>
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-foreground h-full rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {loadingProgress}% — first load ~2 GB, cached after
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <BotIcon className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">AI Extraction (optional)</span>
      </div>
      <p className="text-muted-foreground text-xs">
        Load a local AI model to improve extraction accuracy for screenshots and
        non-standard formats. Runs entirely in your browser — no data leaves
        your device.
      </p>
      <p className="text-muted-foreground text-xs">
        First load downloads ~2 GB and is cached. If you already loaded it in
        the Timetable tab, it won&apos;t re-download.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={onInit}
        className="w-full gap-2">
        <BotIcon className="size-4" />
        Load AI Model
      </Button>
    </div>
  )
}
