import { getAiInstructionsContent } from "@/lib/ai-instructions-content"

export const dynamic = "force-static"

export function GET() {
  return new Response(getAiInstructionsContent(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  })
}
