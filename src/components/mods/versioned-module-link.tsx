import Link from "next/link"

import { getModuleVersionUrl } from "@/lib/module-url"

interface Props {
  code: string
  year: string
  semester: string
  className?: string
  children: React.ReactNode
}

export const VersionedModuleLink = ({
  code,
  year,
  semester,
  className,
  children
}: Props) => {
  return (
    <Link
      href={getModuleVersionUrl(code, year, semester)}
      className={className}>
      {children}
    </Link>
  )
}
