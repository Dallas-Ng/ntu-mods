"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import CustomSelect from "@/components/select"

export type Semester = "s1" | "s2" | "all"

interface Props {
  defaultValue: Semester
}

export const ModsSemesterSelect = ({ defaultValue = "s2" }: Props) => {
  const [semester, setSemester] = useState<Semester>(defaultValue)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (params.get("semester") === null && semester === "s2") return

    params.set("semester", semester)
    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [semester])

  return (
    <CustomSelect
      closeOnSelect
      defaultValue={defaultValue}
      selectItems={[
        { value: "all", label: "All Sems" },
        { value: "s1", label: "Sem 1" },
        { value: "s2", label: "Sem 2" }
      ]}
      onChange={(value) => setSemester(value as Semester)}
      divClassName="basis-2/5 lg:w-[200px]"
    />
  )
}
