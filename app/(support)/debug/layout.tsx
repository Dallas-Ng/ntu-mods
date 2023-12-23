import { Metadata } from "next"

import PageLayout from "@/components/page-layout"

export const metadata: Metadata = {
  title: `Help`
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <PageLayout>{children}</PageLayout>
}
