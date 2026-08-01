"use client"

import { useEffect, useRef, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { RefreshCwIcon, SendIcon, WandIcon } from "lucide-react"
import posthog from "posthog-js"

import { latestSemester, latestYear } from "@/lib/semesters"
import { TIMETABLE_AI_SYSTEM_PROMPT } from "@/lib/timetable-ai-system-prompt"
import { useAllModules } from "@/hooks/use-all-modules"
import { useSeasonExams } from "@/hooks/use-season-exams"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableGeneration } from "@/hooks/use-timetable-generation"
import { useWebLLM } from "@/hooks/use-web-llm"
import { Button } from "@/components/ui/button"

import TimetableResultsCycler from "../mode-generation/timetable-results-cycler"
import TimetableAiModelLoader from "./timetable-ai-model-loader"

// Matches complete ```json ... ``` blocks
const JSON_BLOCK_REGEX = /```json\s*([\s\S]*?)```/
const INITIAL_ASSISTANT_MESSAGE =
  "What matters most to you in your timetable? (e.g. free days, no early mornings, lunch breaks)"

type WebLLMMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

// Strips all code fences from display (complete AND partial mid-stream)
function stripCodeBlocks(text: string): string {
  // Remove complete ```...``` blocks of any language
  let result = text.replace(/```[\s\S]*?```/g, "")
  // Remove any partial opening fence still streaming (``` at end with no closing)
  result = result.replace(/```[\s\S]*$/, "")
  return result.trim()
}

function stripRoleLabels(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const assistantMatch = line.match(/^\s*(response|assistant)\s*:\s*(.*)$/i)
      if (assistantMatch) return assistantMatch[2]
      if (/^\s*(prompter|prompt|user)\s*:/i.test(line)) return ""
      return line
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function cleanAssistantContent(text: string): string {
  return stripRoleLabels(stripCodeBlocks(text))
}

function extractConfig(text: string): GenerationConfig | null {
  const match = text.match(JSON_BLOCK_REGEX)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    const config: GenerationConfig = parsed.config ?? null
    if (!config) return null
    // AI sometimes outputs raw minutes instead of 30-min units — normalize
    return {
      ...config,
      maxConsecutiveSlots:
        config.maxConsecutiveSlots > 12
          ? Math.round(config.maxConsecutiveSlots / 30)
          : config.maxConsecutiveSlots,
      minGapBetweenClasses:
        config.minGapBetweenClasses > 4
          ? Math.round(config.minGapBetweenClasses / 30)
          : config.minGapBetweenClasses,
      preferredFreeDays: config.preferredFreeDays ?? [],
      maxDailyHours: Math.min(8, Math.max(0, config.maxDailyHours ?? 0)),
      preferredDayOrder: config.preferredDayOrder ?? "none",
      avoidBackToBackTypes: config.avoidBackToBackTypes ?? []
    }
  } catch {
    return null
  }
}

const TimetableAiChat = () => {
  const updateGenerationConfig = useBoundState((s) => s.updateGenerationConfig)
  const { timetable } = useTimetable()
  const { modules: allModules } = useAllModules()
  const { exams } = useSeasonExams(latestYear, latestSemester)
  const { initModel, chat, isLoading, loadingProgress, isReady, error } =
    useWebLLM()
  const {
    combinations,
    currentIdx,
    isGenerating,
    truncated,
    duplicatesSkipped,
    hasGenerated,
    generate,
    navigateTo,
    saveToPlan
  } = useTimetableGeneration()
  const uniqueTimeslotsOnly = useBoundState((s) => s.uniqueTimeslotsOnly)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isChatting, setIsChatting] = useState(false)
  const [pendingConfig, setPendingConfig] = useState<GenerationConfig | null>(
    null
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wasGenerating = useRef(false)
  const noModules = Object.keys(timetable).length === 0

  useEffect(() => {
    if (
      wasGenerating.current &&
      !isGenerating &&
      hasGenerated &&
      combinations.length === 0
    ) {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "No valid combinations were found with those settings — the constraints may be too strict for your modules. Which would you like to relax? (e.g. remove the gap requirement, allow more hours per day, or fewer free day preferences)"
      }
      setMessages((prev) => [...prev, msg])
      scrollToBottom()
    }
    wasGenerating.current = isGenerating
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating])

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      })
    }, 50)
  }

  // Seed the chat directly instead of asking the model to greet. The local
  // model can otherwise treat a fake "Hi" trigger as off-topic and redirect.
  useEffect(() => {
    if (isReady && messages.length === 0) {
      startChat()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  const createInitialMessage = (): ChatMessage => ({
    id: crypto.randomUUID(),
    role: "assistant",
    content: INITIAL_ASSISTANT_MESSAGE
  })

  const startChat = () => {
    setMessages([createInitialMessage()])
    setIsChatting(false)
    scrollToBottom()
  }

  const sendMessage = async () => {
    if (!input.trim() || isChatting) return

    posthog.capture("ai_message_sent", {
      message_count: messages.length + 1,
      module_count: Object.keys(timetable).length
    })

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim()
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")
    setIsChatting(true)
    scrollToBottom()

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: ""
    }
    setMessages([...updatedMessages, assistantMsg])

    const moduleCodes = Object.keys(timetable)
    let systemPrompt = TIMETABLE_AI_SYSTEM_PROMPT
    if (moduleCodes.length > 0) {
      const moduleMap = new Map(allModules.map((m) => [m.code, m]))
      let totalAu = 0
      let earliestExam: string | null = null
      const parts = moduleCodes.map((code) => {
        const mod = moduleMap.get(code)
        const au = mod ? parseFloat(mod.au) : 0
        totalAu += au
        const exam = exams[code]
        if (exam && !earliestExam) earliestExam = exam.date
        return `${code}(${mod?.au ?? "?"}AU${exam ? ` exam:${exam.date}` : ""})`
      })
      systemPrompt += `\n\nModules: ${parts.join(" ")} | Total:${totalAu}AU | ${earliestExam ? `Earliest exam:${earliestExam}` : "No exams"}`
    }

    const apiMessages: WebLLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...updatedMessages.map((m) => ({
        role: m.role,
        content:
          m.role === "assistant" ? cleanAssistantContent(m.content) : m.content
      }))
    ]

    let full = ""
    let detectedConfig: GenerationConfig | null = null

    await chat(
      apiMessages,
      (chunk) => {
        full += chunk
        const cleaned = stripRoleLabels(full)
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last.role === "assistant") {
            return [...prev.slice(0, -1), { ...last, content: cleaned }]
          }
          return prev
        })

        const config = extractConfig(full)
        if (config && !detectedConfig) {
          detectedConfig = config
        }
      },
      () => {
        if (detectedConfig) {
          setPendingConfig(detectedConfig)
        }
        setIsChatting(false)
        scrollToBottom()
      }
    )
  }

  const handleGenerate = () => {
    if (!pendingConfig) return
    posthog.capture("ai_timetable_generated", {
      module_count: Object.keys(timetable).length,
      preferred_free_days: pendingConfig.preferredFreeDays?.length ?? 0
    })
    updateGenerationConfig(pendingConfig)
    generate(pendingConfig)
    setPendingConfig(null)
  }

  const handleReset = () => {
    posthog.capture("ai_chat_reset", {
      messages_count: messages.length,
      had_pending_config: pendingConfig !== null
    })
    setMessages([])
    setInput("")
    setPendingConfig(null)
    if (isReady) startChat()
  }

  if (!isReady || isLoading || error) {
    return (
      <TimetableAiModelLoader
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        error={error}
        onInit={initModel}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Chat area */}
      <div className="flex flex-col rounded-lg border">
        <div className="flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-xs font-medium">AI Assistant</span>
          <button
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            aria-label="New chat">
            <RefreshCwIcon className="size-3.5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex max-h-64 flex-col gap-2 overflow-y-auto p-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground"
                }`}>
                {msg.role === "assistant" && !msg.content && (
                  <span className="text-muted-foreground animate-pulse">
                    Thinking…
                  </span>
                )}
                <span className="whitespace-pre-wrap">
                  {msg.role === "assistant"
                    ? cleanAssistantContent(msg.content)
                    : msg.content}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t p-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type a message…"
            disabled={isChatting}
            className="bg-background placeholder:text-muted-foreground min-w-0 flex-1 text-xs outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isChatting || !input.trim()}
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:pointer-events-none disabled:opacity-40"
            aria-label="Send">
            <SendIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {noModules && (
        <p className="text-muted-foreground text-center text-xs">
          Add modules above before generating
        </p>
      )}

      {/* Generate button when config ready */}
      {pendingConfig && (
        <Button
          onClick={handleGenerate}
          className="w-full gap-2"
          disabled={isGenerating}>
          <WandIcon className="size-4" />
          {isGenerating ? "Generating…" : "Generate Timetable"}
        </Button>
      )}

      {hasGenerated && combinations.length === 0 && !isGenerating && (
        <p className="text-muted-foreground text-center text-xs">
          No valid combinations found. Try relaxing your preferences.
        </p>
      )}

      {combinations.length > 0 && (
        <TimetableResultsCycler
          combinations={combinations}
          currentIndex={currentIdx}
          onNavigate={navigateTo}
          onSaveToPlan={saveToPlan}
          truncated={truncated}
          uniqueTimeslotsOnly={uniqueTimeslotsOnly}
          duplicatesSkipped={duplicatesSkipped}
        />
      )}
    </div>
  )
}

export default TimetableAiChat
