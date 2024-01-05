"use client"

import { useEffect } from "react"
import { clarity } from "react-microsoft-clarity"

import { IS_PROD } from "@/lib/utils"

export default function ClarityTag() {
  useEffect(() => {
    if (IS_PROD) {
      if (!(window as any).clarity) {
        clarity.init("k9d6cixduy")
      }
    }
  }, [])

  return <></>
}
