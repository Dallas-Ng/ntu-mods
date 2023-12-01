import { NextPage } from "next"
import Link from "next/link"

import { Icons } from "@/components/icons"

const IndexPage: NextPage = () => {
  return (
    <div className="container p-5 bg-white dark:bg-slate-950 ">
      <h1>Home Page</h1>

      <Icons.logo className="h-60 w-60" />

      <p>
        <Link href="/stars">Stars</Link>
      </p>

      <p>
        <Link href="/help">Help</Link>
      </p>
    </div>
  )
}

export default IndexPage
