"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { getLsItem, setLsItem } from "@/lib/local-storage"

import { Button } from "./ui/button"

interface Props {
  children: React.ReactNode
}

const BetaLockWrapper = ({ children }: Props) => {
  // We default to allow as we dont want SSR to render blank
  const [auth, setAuth] = useState(true)
  const isBetaDomain = window.location.hostname.includes("beta")

  useEffect(() => {
    if (isBetaDomain) {
      const hasLsBetaKey = getLsItem("BETA_AUTH_VALID")

      setAuth(hasLsBetaKey ? true : false)

      if (!hasLsBetaKey) handleAuth()
    }
  }, [auth])

  const handleAuth = () => {
    if (auth) return

    if (isBetaDomain) {
      const password = window.prompt("")

      if (password !== "TEMP_PASSWORD") {
        alert("Invalid Password")
      } else {
        setLsItem("BETA_AUTH_VALID", "true")
        setAuth(true)
      }
    }
  }

  return !auth ? (
    <div className="flex size-full min-h-[100vh] items-center justify-center">
      <div className="flex flex-col space-y-4">
        <p className="text-center font-semibold text-red-600">
          Invalid Password
        </p>

        <Link href="https://ntumods.com" passHref>
          <Button>Go back to main page</Button>
        </Link>

        <Button variant="ghost" onClick={handleAuth}>
          Log in
        </Button>
      </div>
    </div>
  ) : (
    <>{children}</>
  )
}

export default BetaLockWrapper
