"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { MODULE_CATEGORY } from "@/lib/constants"
import CustomSelect from "@/components/select"

export type SearchModuleType = ModuleType | "all"

interface Props {
  defaultValue?: SearchModuleType
}

export const ModsModuleTypeSelect = ({ defaultValue = "all" }: Props) => {
  const [moduleType, setModuleType] = useState<SearchModuleType>(defaultValue)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (params.get("moduleType") === null && moduleType === "all") return

    params.set("moduleType", moduleType)
    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [moduleType])

  const selectItems = [
    { value: "all", label: "All Module Types" },
    ...Object.entries(MODULE_CATEGORY)
      .filter(([k]) => k !== "USP")
      .map(([categoryKey, categoryName]) => ({
        value: categoryKey,
        label: categoryName
      }))
  ]

  return (
    <CustomSelect
      closeOnSelect
      defaultValue="all"
      selectItems={selectItems}
      onChange={(value) => setModuleType(value as SearchModuleType)}
      divClassName="basis-3/5 lg:w-[200px]"
    />
  )
}
