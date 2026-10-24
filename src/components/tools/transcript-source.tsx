import { CircleCheck, FlaskConical, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  /** Example data rather than the student's own transcript. */
  sample: boolean
  fileName: string
  summary: string
  onUpload: () => void
}

// Replaces the drop zone once data is loaded. Sample data keeps nudging the
// student to upload their own transcript; a real upload just confirms it.
// Both states share one fixed-height row so swapping between them never
// shifts the page.
export function TranscriptSource({
  sample,
  fileName,
  summary,
  onUpload
}: Props) {
  return (
    <div className="bg-primary-subtle flex h-[4.5rem] items-center justify-between gap-3 rounded-2xl px-4">
      <div className="flex min-w-0 items-center gap-3">
        {sample ? (
          <FlaskConical className="text-primary size-5 shrink-0" />
        ) : (
          <CircleCheck className="text-success size-5 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {sample ? (
              <>
                <span className="sm:hidden">Sample data</span>
                <span className="hidden sm:inline">
                  You are viewing sample data
                </span>
              </>
            ) : (
              fileName
            )}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {sample ? (
              <>
                <span className="sm:hidden">Upload yours for real results</span>
                <span className="hidden sm:inline">
                  Upload your own transcript to see your real results.
                </span>
              </>
            ) : (
              `${summary} · Read in your browser, never uploaded`
            )}
          </p>
        </div>
      </div>
      {sample ? (
        <Button size="sm" onClick={onUpload} className="shrink-0">
          <Upload />
          <span className="sm:hidden">Upload</span>
          <span className="hidden sm:inline">Upload your transcript</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onUpload}
          className="bg-background shrink-0">
          Change
        </Button>
      )}
    </div>
  )
}
