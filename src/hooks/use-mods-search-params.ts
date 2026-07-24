import { useEffect, useState } from "react"

import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"

type Key =
  | "searchTerm"
  | "semester"
  | "moduleType"
  | "moduleFaculty"
  | "moduleLevel"
  | "currentOnly"
  | "favouritesOnly"
  | "moduleDay"
  | "moduleTimeStart"
  | "moduleTimeEnd"

export const useModsSearchParams = (paramValue: string, key: Key) => {
  const defaultValue =
    key === "searchTerm"
      ? ""
      : key === "semester"
        ? "s2"
        : key === "currentOnly"
          ? "true"
          : key === "favouritesOnly"
            ? "false"
            : "all"
  const [value, setValue] = useState(paramValue)

  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    setValue(paramValue)
  }, [paramValue])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    // Dont show default values on searchParams on initialisation
    if (!params.get(key) && defaultValue === value) {
      return
    }

    params.set(key, value)
    pushSearchParams(pathname, params.toString())
  }, [value])

  return { value, setValue }
}
