"use client"

import Link from "next/link"

import { useSettings } from "@/hooks/use-settings"
import Header from "@/components/header"

export default function Page() {
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
      <Header title="Faculty" subtitle="Currently in Beta" />

      <p>Available Faculties</p>

      <ul className="list-inside list-disc">
        <li>
          <Link href="/faculty/scse" className="text-primary">
            SCSE
          </Link>
        </li>
      </ul>
    </div>
  )
}
