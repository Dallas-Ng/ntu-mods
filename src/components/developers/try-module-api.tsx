"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Code, Rich } from "@/components/developers/code"

const CODE = /^[A-Z0-9]{2,12}$/
const MAX_CHARS = 4000

// One GET per click, to this origin only, with a short cooldown after each.
const TryModuleApi = () => {
  const [value, setValue] = useState("SC1003")
  const [busy, setBusy] = useState(false)
  const [output, setOutput] = useState<{ status: string; body: string } | null>(
    null
  )

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
      setOutput({ status: `HTTP ${res.status}`, body: clipped })
    } catch {
      setOutput({
        status: "Request failed",
        body: "Check your connection and try again."
      })
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
          <Rich text="Use 2 to 12 letters or digits, for example `SC1003`." />
        </p>
      )}
      {output && <Code code={output.body} lang="json" title={output.status} />}
    </div>
  )
}

export default TryModuleApi
