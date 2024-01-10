import Link from "next/link"

export default function NotFoundModulePage() {
  return (
    <>
      <h1 className="mb-2 text-xl">This page does not exists</h1>

      <Link href="/" className="hover:text-secondary-foreground">
        Click here to return Home
      </Link>

      {/* TODO: Make a do you mean page. */}
    </>
  )
}
