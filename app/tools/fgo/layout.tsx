import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FGO Analyser — NTUMods",
  description:
    "Upload your NTU degree audit to find the optimal Flexible Grading Option strategy and maximise your CGPA. Runs entirely in your browser."
}

interface LayoutProps {
  children: React.ReactNode
}

export default function FgoLayout({ children }: LayoutProps) {
  return children
}
