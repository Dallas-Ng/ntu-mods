"use client"

import { useCallback, useEffect, useState } from "react"
import type { MLCEngine } from "@mlc-ai/web-llm"

import { reportError } from "@/lib/analytics"

const MODEL_ID = "Phi-3-mini-4k-instruct-q4f16_1-MLC"

// Module-level persistent state — survives component unmount/remount
let globalEngine: MLCEngine | null = null
let globalLoadPromise: Promise<MLCEngine> | null = null
let globalProgress = 0
let globalIsLoading = false
let globalIsReady = false
let globalError: string | null = null

type Subscriber = (state: {
  progress: number
  isLoading: boolean
  isReady: boolean
  error: string | null
}) => void

const subscribers = new Set<Subscriber>()

function notify() {
  const state = {
    progress: globalProgress,
    isLoading: globalIsLoading,
    isReady: globalIsReady,
    error: globalError
  }
  subscribers.forEach((fn) => fn(state))
}

export function useWebLLM() {
  const [progress, setProgress] = useState(globalProgress)
  const [isLoading, setIsLoading] = useState(globalIsLoading)
  const [isReady, setIsReady] = useState(globalIsReady)
  const [error, setError] = useState(globalError)

  // Subscribe to global state updates on mount, unsubscribe on unmount
  useEffect(() => {
    const subscriber: Subscriber = (state) => {
      setProgress(state.progress)
      setIsLoading(state.isLoading)
      setIsReady(state.isReady)
      setError(state.error)
    }
    subscribers.add(subscriber)
    // Sync to current global state immediately on mount
    subscriber({
      progress: globalProgress,
      isLoading: globalIsLoading,
      isReady: globalIsReady,
      error: globalError
    })
    return () => {
      subscribers.delete(subscriber)
    }
  }, [])

  const initModel = useCallback(async () => {
    // Already ready
    if (globalEngine) return

    // Download already in progress — just wait (progress updates come via subscriber)
    if (globalLoadPromise) return

    // Check WebGPU support
    const nav = navigator as Navigator & { gpu?: unknown }
    if (!nav.gpu) {
      globalError = "webgpu_unsupported"
      notify()
      return
    }

    globalIsLoading = true
    globalProgress = 0
    globalError = null
    notify()

    globalLoadPromise = (async () => {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm")
      const engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (p) => {
          globalProgress = Math.round(p.progress * 100)
          notify()
        }
      })
      return engine
    })()

    try {
      const engine = await globalLoadPromise
      globalEngine = engine
      globalIsLoading = false
      globalIsReady = true
      globalProgress = 100
      notify()
    } catch (e) {
      reportError("webllm_load", e)
      globalLoadPromise = null
      globalIsLoading = false
      globalError = e instanceof Error ? e.message : "Failed to load model"
      notify()
    }
  }, [])

  const chat = useCallback(
    async (
      messages: { role: "system" | "user" | "assistant"; content: string }[],
      onChunk: (chunk: string) => void,
      onDone: () => void
    ) => {
      if (!globalEngine) return
      try {
        const stream = await globalEngine.chat.completions.create({
          messages,
          stream: true,
          temperature: 0.3,
          max_tokens: 512
        })
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ""
          if (delta) onChunk(delta)
        }
        onDone()
      } catch (e) {
        onDone()
        throw e
      }
    },
    []
  )

  const unload = useCallback(() => {
    globalEngine?.unload()
    globalEngine = null
    globalLoadPromise = null
    globalProgress = 0
    globalIsLoading = false
    globalIsReady = false
    globalError = null
    notify()
  }, [])

  return {
    initModel,
    chat,
    unload,
    isLoading,
    loadingProgress: progress,
    isReady,
    error
  }
}
