"use client"

import { useState } from "react"
import { Loader2Icon } from "lucide-react"

import type { ExtractedAudit, OptimisationResult } from "@/types/fgo"
import { optimise } from "@/lib/fgo-optimizer"
import { useFgoExtractor } from "@/hooks/use-fgo-extractor"
import { useWebLLM } from "@/hooks/use-web-llm"

import FgoDataReview from "./fgo-data-review"
import FgoModelLoader from "./fgo-model-loader"
import FgoResults from "./fgo-results"
import FgoUpload from "./fgo-upload"

type Step = "upload" | "review" | "results"

export default function FgoApp() {
  const [step, setStep] = useState<Step>("upload")
  const [result, setResult] = useState<OptimisationResult | null>(null)

  const extractor = useFgoExtractor()
  const llm = useWebLLM()

  function handleConfirm(audit: ExtractedAudit) {
    const opt = optimise(audit)
    setResult(opt)
    setStep("results")
  }

  function handleReset() {
    extractor.reset()
    setResult(null)
    setStep("upload")
  }

  // After extraction completes, advance to review
  const showReview =
    step === "upload" &&
    extractor.status === "done" &&
    extractor.result !== null

  return (
    <div className="flex flex-col gap-8">
      {step === "upload" && (
        <>
          {/* AI model loader — optional, shown alongside upload */}
          <FgoModelLoader
            isLoading={llm.isLoading}
            loadingProgress={llm.loadingProgress}
            isReady={llm.isReady}
            error={llm.error}
            onInit={llm.initModel}
          />

          {/* Upload / paste */}
          {extractor.status === "idle" || extractor.status === "error" ? (
            <div className="flex flex-col gap-3">
              <FgoUpload
                onFile={extractor.processFile}
                onText={extractor.processText}
                disabled={
                  extractor.status !== "idle" && extractor.status !== "error"
                }
              />
              {extractor.error && (
                <p className="text-destructive text-sm">{extractor.error}</p>
              )}
            </div>
          ) : extractor.status !== "done" ? (
            /* Extraction in progress */
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{extractor.statusText}</p>
                <p className="text-muted-foreground text-xs">
                  {extractor.progress}%
                </p>
              </div>
              <div className="bg-muted h-1.5 w-48 overflow-hidden rounded-full">
                <div
                  className="bg-foreground h-full rounded-full transition-all duration-300"
                  style={{ width: `${extractor.progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* Advance to review once done */}
          {showReview && extractor.result && (
            <FgoDataReview
              audit={extractor.result}
              onConfirm={handleConfirm}
              onReset={handleReset}
            />
          )}
        </>
      )}

      {step === "review" && extractor.result && (
        <FgoDataReview
          audit={extractor.result}
          onConfirm={handleConfirm}
          onReset={handleReset}
        />
      )}

      {step === "results" && result && (
        <FgoResults result={result} onReset={handleReset} />
      )}
    </div>
  )
}
