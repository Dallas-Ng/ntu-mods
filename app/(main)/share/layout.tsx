import { Metadata } from "next"

import PageLayout from "@/components/page-layout"

export const metadata: Metadata = {
  title: `Stars* Planner`,
  description: `Plan your timetable`
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <PageLayout containerClassName="p-0">{children}</PageLayout>
}
