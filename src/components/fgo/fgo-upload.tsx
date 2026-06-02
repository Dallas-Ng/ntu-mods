"use client"

import { useCallback, useRef, useState } from "react"
import { FileTextIcon, ImageIcon, TypeIcon, UploadIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  onFile: (file: File) => void
  onText: (text: string) => void
  disabled?: boolean
}

export default function FgoUpload({ onFile, onText, disabled }: Props) {
  const [mode, setMode] = useState<"upload" | "text">("upload")
  const [dragging, setDragging] = useState(false)
  const [pastedText, setPastedText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === "upload" ? "default" : "outline"}
          onClick={() => setMode("upload")}
          disabled={disabled}
          className="gap-2">
          <UploadIcon className="size-3.5" />
          Upload File
        </Button>
        <Button
          size="sm"
          variant={mode === "text" ? "default" : "outline"}
          onClick={() => setMode("text")}
          disabled={disabled}
          className="gap-2">
          <TypeIcon className="size-3.5" />
          Paste Text
        </Button>
      </div>

      {mode === "upload" && (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
            dragging
              ? "border-foreground bg-muted"
              : "border-muted-foreground/30 hover:border-muted-foreground/60",
            disabled && "pointer-events-none opacity-50"
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}>
          <div className="text-muted-foreground flex gap-3">
            <FileTextIcon className="size-8" />
            <ImageIcon className="size-8" />
          </div>
          <div>
            <p className="text-sm font-medium">Drop your degree audit here</p>
            <p className="text-muted-foreground mt-1 text-xs">
              PDF or image (PNG, JPG, WebP)
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}>
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {mode === "text" && (
        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="Paste your degree audit text here..."
            className="min-h-48 font-mono text-xs"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={disabled}
          />
          <Button
            size="sm"
            disabled={!pastedText.trim() || disabled}
            onClick={() => onText(pastedText)}>
            Extract Data
          </Button>
        </div>
      )}
    </div>
  )
}
