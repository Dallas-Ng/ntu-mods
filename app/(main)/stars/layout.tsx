import { Metadata } from "next"

import PageLayout from "@/components/page-layout"

export const metadata: Metadata = {
  title: `Stars* Planner (Shared)`,
  description: `Here's my timetable that I want to share with you`
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <PageLayout containerClassName="p-0">{children}</PageLayout>
}
