"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The site's one copy-to-clipboard button. Icon only by default; pass `label`
 * to show "Copy" / "Copied" beside the icon. The tick stays for two seconds.
 */
function CopyButton({
  value,
  label = false,
  onCopied,
  variant = "ghost",
  size,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "value" | "children"> & {
  /** The text to copy, or a function that builds it at click time. */
  value: string | (() => string)
  label?: boolean
  onCopied?: () => void
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <>
      <Button
        data-copied={copied || undefined}
        variant={variant}
        size={size ?? (label ? "xs" : "icon-xs")}
        aria-label={label ? undefined : copied ? "Copied" : "Copy"}
        onClick={(event) => {
          onClick?.(event)
          // Inside a promise: without a clipboard API (http, old browsers)
          // navigator.clipboard is undefined and would throw synchronously.
          Promise.resolve()
            .then(() =>
              navigator.clipboard.writeText(
                typeof value === "function" ? value() : value
              )
            )
            .then(() => {
              setCopied(true)
              onCopied?.()
            })
            .catch(() => {})
        }}
        {...props}>
        {copied ? <Check /> : <Copy />}
        {label && (copied ? "Copied" : "Copy")}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </>
  )
}

export { CopyButton }
