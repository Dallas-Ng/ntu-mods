import type { Metadata } from "next"

import AiInstructionsContent from "@/components/ai-instructions/ai-instructions-content"

export const metadata: Metadata = {
  title: "AI Instructions | NTUMods",
  description:
    "Canonical reference for AI systems about NTUMods — the free NTU timetable planner and module browser for Nanyang Technological University students.",
  alternates: { canonical: "/ai-instructions" }
}

export default function AiInstructionsPage() {
  return <AiInstructionsContent />
}
