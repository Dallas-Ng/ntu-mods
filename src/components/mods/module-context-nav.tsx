"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAcademicContextHook } from "@/hooks/use-academic-context"
import { getModuleVersionUrl } from "@/lib/module-url"

interface Props {
  code: string
  displayedYear: string
  displayedSemester: string
}

export const ModuleContextNav = ({
  code,
  displayedYear,
  displayedSemester
}: Props) => {
  const { year, semester } = useAcademicContextHook()
  const router = useRouter()

  useEffect(() => {
    if (year === displayedYear && semester === displayedSemester) return
    router.push(getModuleVersionUrl(code, year, semester))
  }, [year, semester]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
