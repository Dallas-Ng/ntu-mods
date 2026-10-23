"use client"

import { useState } from "react"
import { FileUp, Lock, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TextLink } from "@/components/ui/text-link"
import { ShareCheckbox } from "@/components/tools/share-checkbox"

export const TRANSCRIPT_URL =
  "https://wis.ntu.edu.sg/webexe/owa/request_transcript_und.LoginN?pType=SH"

interface Props {
  busy: boolean
  error: string
  share: boolean
  onShareChange: (v: boolean) => void
  /** A dropped file. */
  onFile: (file: File | undefined) => void
  /** Open the parent's hidden file input. */
  onChoose: () => void
  onSample: () => void
  onLinkClick: () => void
  description: string
}

// Shared by the FGO and CGPA tools so both upload prompts look the same.
export function TranscriptDropzone({
  busy,
  error,
  share,
  onShareChange,
  onFile,
  onChoose,
  onSample,
  onLinkClick,
  description
}: Props) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        onFile(e.dataTransfer.files[0])
      }}
      className={cn(
        "flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors sm:py-14",
        dragging && "border-primary bg-primary-subtle"
      )}>
      <span className="bg-background flex size-14 items-center justify-center rounded-full">
        <FileUp className="text-muted-foreground size-6" />
      </span>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tighter">
          {busy ? "Reading your transcript..." : "Upload your NTU transcript"}
        </h2>
        <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed text-pretty">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button disabled={busy} onClick={onChoose}>
          <Upload /> Choose PDF
        </Button>
        <Button variant="outline" disabled={busy} onClick={onSample}>
          Try with sample data
        </Button>
      </div>
      <p className="text-muted-foreground max-w-md text-xs text-pretty">
        <Lock className="mr-1.5 inline size-3 align-[-2px]" />
        Your PDF is read in your browser and never uploaded.{" "}
        <TextLink
          href={TRANSCRIPT_URL}
          onClick={onLinkClick}
          target="_blank"
          rel="noopener noreferrer">
          Get your transcript
        </TextLink>
      </p>
      <ShareCheckbox checked={share} onChange={onShareChange} />
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
