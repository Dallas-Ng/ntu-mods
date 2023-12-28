import Link from "next/link"

export default function NotFound() {
  return (
    <div>
      <h1 className="mb-2 text-xl">This page does not exists</h1>

      <p className="transition duration-200 hover:text-gray-400">
        <Link href="/">Click here to return Home</Link>
      </p>
    </div>
  )
}
