import { useEffect, useRef, useState } from "react"

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

  // The write-to-URL effect below must fire on `value` changes only. Tracking
  // searchParams/pathname would loop: pushing new params updates them, which
  // would retrigger the push. Read them through a ref so the effect always
  // sees current values without depending on them.
  const latest = useRef({ searchParams, pathname, key, defaultValue })

  useEffect(() => {
    latest.current = { searchParams, pathname, key, defaultValue }
  })

  useEffect(() => {
    const {
      searchParams: currentSearchParams,
      pathname: currentPathname,
      key: currentKey,
      defaultValue: currentDefaultValue
    } = latest.current
    const params = new URLSearchParams(currentSearchParams)

    // Dont show default values on searchParams on initialisation
    if (!params.get(currentKey) && currentDefaultValue === value) {
      return
    }

    params.set(currentKey, value)
    pushSearchParams(currentPathname, params.toString())
  }, [value])

  return { value, setValue }
}
