import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <>
      <h1 className="bg-gradient-to-r from-emerald-500 to-emerald-900 bg-clip-text text-3xl font-bold text-transparent">
        Help
      </h1>

      <div className="mt-3">
        <Link href="/debug">
          <Button>Click here if you are stuck!</Button>
        </Link>
      </div>
    </>
  )
}
