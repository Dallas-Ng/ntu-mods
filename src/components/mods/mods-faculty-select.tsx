"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { MODULE_FACULTY } from "@/lib/constants"
import CustomSelect from "@/components/select"

export type SearchModuleFaculty = ModuleFaculty | "all"

interface Props {
  defaultValue?: SearchModuleFaculty
}

export const ModsFacultySelect = ({ defaultValue = "all" }: Props) => {
  const [moduleFaculty, setModuleFaculty] =
    useState<SearchModuleFaculty>(defaultValue)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (params.get("moduleFaculty") === null && moduleFaculty === "all") return

    params.set("moduleFaculty", moduleFaculty)
    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [moduleFaculty])

  const selectItems = [
    { value: "all", label: "All Faculty" },
    ...Object.entries(MODULE_FACULTY).map(([categoryKey, categoryName]) => ({
      value: categoryKey,
      label: (
        <div className="flex items-baseline gap-1">
          {categoryName}

          <span className="text-xs text-muted-foreground">({categoryKey})</span>
        </div>
      )
    }))
  ]

  return (
    <CustomSelect
      closeOnSelect
      defaultValue={defaultValue}
      selectItems={selectItems}
      onChange={(value) => setModuleFaculty(value as SearchModuleFaculty)}
      divClassName="w-full lg:max-w-[350px]"
    />
  )
}
