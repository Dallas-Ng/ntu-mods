"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import CustomSelect from "@/components/select"

type Semester = "s1" | "s2" | "all"

interface Props {
  defaultValue: Semester
}

const ModsSemesterSelect = ({ defaultValue = "s2" }: Props) => {
  const [semester, setSemester] = useState<Semester>(defaultValue)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    params.set("semester", semester)

    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [semester])

  return (
    <CustomSelect
      defaultValue="s2"
      selectItems={[
        { value: "all", label: "All Semesters" },
        { value: "s1", label: "Semester 1" },
        { value: "s2", label: "Semester 2" }
      ]}
      onChange={(value) => setSemester(value as Semester)}
      divClassName="w-50% md:w-[200px]"
    />
  )
}

export default ModsSemesterSelect
