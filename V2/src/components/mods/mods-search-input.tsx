"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useDebounce } from "@/hooks/use-debounce"

import { Input } from "../ui/input"

interface Props {
  defaultValue: string
}

const ModsSearchInput = ({ defaultValue }: Props) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const dbSearchTerm = useDebounce(searchTerm, 200)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (!dbSearchTerm || dbSearchTerm === "") {
      params.set("dbSearchTerm", "")
    } else {
      params.set("dbSearchTerm", dbSearchTerm)
    }

    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [dbSearchTerm])

  return (
    <Input
      className="md:flex-1"
      name="moduleCode"
      placeholder="Search for module name or code"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  )
}

export default ModsSearchInput
