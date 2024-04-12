"use client"

import Link from "next/link"

import { useSettings } from "@/hooks/use-settings"
import Header from "@/components/header"

export default function Page({ params }: { params: { faculty: string } }) {
  const { isBeta } = useSettings()

  if (!isBeta) {
    return (
      <div className="space-y-3">
        <p>This page is currently for beta users only</p>

        <Link href="/settings#beta">Click here to sign up for beta</Link>
      </div>
    )
  }

  return (
    <div>
      <Header title={params.faculty} subtitle="Customise the website!" />
    </div>
  )
}
