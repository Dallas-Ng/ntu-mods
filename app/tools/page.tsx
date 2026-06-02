import { GraduationCapIcon } from "lucide-react"

import LayoutDefault from "@/components/layout-default"
import ToolCard from "@/components/tools/tool-card"

const TOOLS = [
  {
    title: "FGO Analyser",
    description:
      "Upload your degree audit to find the optimal Flexible Grading Option strategy and maximise your CGPA.",
    href: "/tools/fgo",
    icon: GraduationCapIcon,
    badge: "AI-powered"
  }
]

export default function ToolsPage() {
  return (
    <LayoutDefault size="md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Academic planning tools that run entirely in your browser — no data is
          sent to any server.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </LayoutDefault>
  )
}
