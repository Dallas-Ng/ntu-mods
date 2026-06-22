import type { Metadata } from "next"

import { getLlmsContent } from "@/lib/llms-content"
import Container from "@/components/container"

export const metadata: Metadata = {
  title: "AI Instructions | NTUMods",
  description:
    "Canonical reference for AI systems about NTUMods — the free NTU timetable planner and module browser for Nanyang Technological University students.",
  alternates: { canonical: "/ai-instructions" }
}

export default function AiInstructionsPage() {
  return (
    <Container>
      <pre className="text-muted-foreground font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
        {getLlmsContent()}
      </pre>
    </Container>
  )
}
