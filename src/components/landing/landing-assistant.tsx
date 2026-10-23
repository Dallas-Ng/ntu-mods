import { siteConfig } from "@/config/site"
import {
  CLAUDE_COLOUR,
  ClaudeIcon,
  CURSOR_COLOUR,
  CursorIcon,
  OPENAI_COLOUR,
  OpenAIIcon
} from "@/components/brand-icons"
import AssistantPreview from "@/components/tools/assistant-preview"

const LandingAssistant = () => {
  const tool = siteConfig.tools.find((t) => t.href === "/developers/mcp")!

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="bg-muted landing-reveal grid gap-8 rounded-3xl p-3 md:gap-10 md:p-10 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-5 px-2 pt-2 md:p-0">
          <h2 className="max-w-xl text-3xl leading-[1.15] font-bold tracking-tight text-balance md:text-5xl md:leading-[1.1]">
            Ask Claude or ChatGPT about NTU
          </h2>
          <p className="text-foreground/80 max-w-md text-base leading-relaxed md:text-lg">
            Add NTUMods once and your assistant looks up modules, class indexes
            and exam dates for you. No sign-in, and nothing about you is shared.
          </p>
          <div className="mt-1 flex flex-col gap-5">
            <div className="grid gap-3 sm:w-fit sm:auto-cols-fr sm:grid-flow-col">
              <a
                href={siteConfig.links.claudeDirectory}
                className="bg-background text-foreground hover:bg-background/70 inline-flex h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors sm:px-6">
                <ClaudeIcon
                  className="size-5 shrink-0"
                  style={{ color: CLAUDE_COLOUR }}
                />
                Add to Claude
                <span aria-hidden className="text-muted-foreground">
                  ↗
                </span>
              </a>
              <a
                href={`${tool.href}#connect`}
                className="bg-background text-foreground hover:bg-background/70 inline-flex h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors sm:px-6">
                <span className="flex -space-x-2">
                  {[
                    [CursorIcon, CURSOR_COLOUR],
                    [OpenAIIcon, OPENAI_COLOUR]
                  ].map(([Icon, bg], i) => (
                    <span
                      key={i}
                      className="ring-background grid size-6 place-items-center rounded-full text-white ring-2"
                      style={{ background: bg as string }}>
                      <Icon className="size-3.5" />
                    </span>
                  ))}
                  <span className="ring-background grid size-6 place-items-center rounded-full bg-white ring-2">
                    <img
                      src="/logos/gemini.png"
                      alt=""
                      width={96}
                      height={96}
                      className="size-4"
                    />
                  </span>
                </span>
                Add to others
                <span aria-hidden className="text-muted-foreground">
                  ↗
                </span>
              </a>
            </div>
            {tool.guide && (
              <a
                href={tool.guide.href}
                className="text-primary w-fit text-sm font-semibold underline-offset-4 hover:underline">
                {tool.guide.label}
              </a>
            )}
          </div>
        </div>
        <div className="bg-background flex items-center justify-center rounded-2xl p-2 md:min-h-80 md:p-8">
          <AssistantPreview />
        </div>
      </div>
    </section>
  )
}

export default LandingAssistant
