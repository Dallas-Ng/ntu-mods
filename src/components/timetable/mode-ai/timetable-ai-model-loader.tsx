"use client"

import { BotIcon, ExternalLinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  isLoading: boolean
  loadingProgress: number
  error: string | null
  onInit: () => void
}

const TimetableAiModelLoader = ({
  isLoading,
  loadingProgress,
  error,
  onInit
}: Props) => {
  if (error === "webgpu_unsupported") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <BotIcon className="text-muted-foreground size-5" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Your browser doesn&apos;t support WebGPU, which is needed to run the
          AI locally.
        </p>
        <p className="text-muted-foreground text-xs">
          Try Chrome or Edge on a recent device, or switch to{" "}
          <strong>Generate mode</strong> for manual configuration.
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
          <BotIcon className="text-muted-foreground size-5" />
          <span className="text-sm font-medium">AI Assistant</span>
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
          <BotIcon className="text-muted-foreground size-5 animate-pulse" />
          <span className="text-sm font-medium">Loading AI model…</span>
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-foreground h-full rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {loadingProgress}% — cached after first load (~2GB)
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <BotIcon className="text-muted-foreground size-5" />
        <span className="text-sm font-medium">AI Assistant</span>
      </div>
      <p className="text-muted-foreground text-sm">
        Chat with a local AI to plan your timetable preferences. The model runs
        entirely in your browser — no data is sent anywhere.
      </p>
      <p className="text-muted-foreground text-xs">
        First load downloads ~2GB and is cached. Takes 30–60 seconds depending
        on your connection.
      </p>
      <Button size="sm" onClick={onInit} className="w-full gap-2">
        <BotIcon className="size-4" />
        Load AI Model
      </Button>
    </div>
  )
}

export default TimetableAiModelLoader
