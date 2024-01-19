"use client"

import { Fragment, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { MODULE_CATEGORY } from "@/lib/constants"
import CustomSelect from "@/components/select"

type SearchModuleType = ModuleType | "all"

interface Props {
  defaultValue?: SearchModuleType
}

const ModsModuleTypeSelect = ({ defaultValue = "all" }: Props) => {
  const [moduleType, setModuleType] = useState<SearchModuleType>(defaultValue)

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

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
      defaultValue="all"
      selectItems={selectItems}
      onChange={(value) => setModuleType(value as SearchModuleType)}
      divClassName="w-50% md:w-[200px]"
    />
  )
}

export default ModsModuleTypeSelect
