"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"

import { Input } from "../ui/input"

const ModsSearchInput = ({ paramsValue }: { paramsValue: string }) => {
  console.log(paramsValue)
  const { value, setValue } = useModsSearchParams(paramsValue, "searchTerm")
  const [currSearchTerm, setCurrSearchTerm] = useState<string>(paramsValue)
  const dbSearchTerm = useDebounce(currSearchTerm, 200)

  useEffect(() => {
    setValue(dbSearchTerm)
  }, [dbSearchTerm])

  useEffect(() => {
    setCurrSearchTerm(paramsValue)
  }, [paramsValue])

  return (
    <Input
      className={cn(
        "md:flex-1",
        value.length > 0 && "rounded-md ring-1 ring-ring"
      )}
      name="searchTerm"
      placeholder="Search for module name or code"
      value={currSearchTerm}
      onChange={(e) => setCurrSearchTerm(e.target.value)}
    />
  )
}

export default ModsSearchInput
