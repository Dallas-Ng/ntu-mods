import Link from "next/link"

import LayoutDefault from "@/components/layout-default"

export default function NotFound() {
  return (
    <LayoutDefault>
      <h1 className="mb-2 text-xl">This page does not exists</h1>

      <Link href="/" className="hover:text-hover-primary">
        Click here to return Home
      </Link>
    </LayoutDefault>
  )
}
