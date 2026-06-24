import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
  const [value, setValue] = useState(defaultValue)

  const searchParams = useSearchParams()
  const router = useRouter()
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
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [value])

  return { value, setValue }
}
