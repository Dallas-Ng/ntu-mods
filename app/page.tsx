import { NextPage } from "next"
import Link from "next/link"

const IndexPage: NextPage = () => {
  return (
    <div>
      <h1>Home Page</h1>

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
