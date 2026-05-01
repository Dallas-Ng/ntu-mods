"use client"

import { useEffect } from "react"
import { clarity } from "react-microsoft-clarity"

import { IS_PROD } from "@/lib/constants"

const ClarityTag = () => {
  useEffect(() => {
    if (IS_PROD) {
      if (!('clarity' in window)) {
        clarity.init("k9d6cixduy")
      }
    }
  }, [])

  return <></>
}

export default ClarityTag
