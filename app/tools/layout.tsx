import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "NTUMods Tools",
  description:
    "Academic planning tools for NTU students — FGO optimiser, CGPA analyser, and more."
}

interface LayoutProps {
  children: React.ReactNode
}

export default function ToolsLayout({ children }: LayoutProps) {
  return children
}
