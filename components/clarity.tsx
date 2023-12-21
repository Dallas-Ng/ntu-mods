"use client"

import { useEffect } from "react"
import { clarity } from "react-microsoft-clarity"

export default function ClarityTag() {
  useEffect(() => {
    console.log("ClarityTag: init")
    if (!(window as any).clarity) {
      clarity.init("k9d6cixduy")
    }
  }, [])

  return <></>
}
