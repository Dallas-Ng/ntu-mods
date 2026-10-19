"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const CODE = /^[A-Z0-9]{2,12}$/
const MAX_CHARS = 4000

// One GET per click, to this origin only, with a short cooldown after each.
const TryModuleApi = () => {
  const [value, setValue] = useState("SC1003")
  const [busy, setBusy] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

  const code = value.trim().toUpperCase()
  const valid = CODE.test(code)

  const run = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/modules/${code}`)
      const text = await res.text()
      let body = text
      try {
        body = JSON.stringify(JSON.parse(text), null, 2)
      } catch {}
      const clipped =
        body.length > MAX_CHARS ? `${body.slice(0, MAX_CHARS)}\n...` : body
      setOutput(`HTTP ${res.status}\n${clipped}`)
    } catch {
      setOutput("Request failed. Check your connection and try again.")
    }
    // Cooldown so the button cannot be hammered.
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setBusy(false)
  }

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void run()
        }}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={12}
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Module code"
          aria-invalid={!valid}
          className="font-mono"
        />
        <Button type="submit" disabled={!valid || busy}>
          {busy ? "Loading" : "Send"}
        </Button>
      </form>
      {!valid && (
        <p className="text-foreground/80 text-sm">
          Use 2 to 12 letters or digits, for example SC1003.
        </p>
      )}
      {output && (
        <pre className="bg-muted max-h-96 overflow-auto rounded-lg p-3 text-xs">
          {output}
        </pre>
      )}
    </div>
  )
}

export default TryModuleApi
