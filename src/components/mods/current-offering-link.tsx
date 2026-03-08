import Link from "next/link"

import { getModuleUrl } from "@/lib/module-url"

interface Props {
  code: string
  className?: string
}

export const CurrentOfferingLink = ({ code, className }: Props) => {
  return (
    <Link href={getModuleUrl(code)} className={className}>
      View current offering →
    </Link>
  )
}
