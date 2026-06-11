"use client"

import { useEffect, useRef, useState } from "react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"

import { Input } from "../ui/input"

const ModsSearchInput = ({ paramsValue }: { paramsValue: string }) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "searchTerm")
  const [currSearchTerm, setCurrSearchTerm] = useState<string>(paramsValue)
  const dbSearchTerm = useDebounce(currSearchTerm, 300)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(dbSearchTerm)
    if (dbSearchTerm.length > 0) {
      posthog.capture("mod_searched", { search_term: dbSearchTerm })
    }
  }, [dbSearchTerm])

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setCurrSearchTerm(paramsValue)
    }
  }, [paramsValue])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      )
        return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Input
      ref={inputRef}
      className={cn(
        "md:flex-1",
        value.length > 0 && "ring-ring rounded-md ring-1"
      )}
      name="searchTerm"
      placeholder="Search for module name or code"
      value={currSearchTerm}
      onChange={(e) => setCurrSearchTerm(e.target.value)}
    />
  )
}

export default ModsSearchInput
