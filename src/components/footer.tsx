import Link from "next/link"

const Footer = () => {
  return (
    <footer className="mt-6 flex h-12 items-center justify-center gap-4 text-center text-sm text-muted-foreground">
      <Link
        href="/privacy"
        className="transition-colors hover:text-primary-alt">
        Privacy
      </Link>

      <Link
        href="/changelog"
        className="transition-colors hover:text-primary-alt">
        Changelog
      </Link>

      <Link
        href="/settings#feedback"
        className="transition-colors hover:text-primary-alt">
        Report an Issue
      </Link>

      <Link
        href="/settings#feedback"
        className="transition-colors hover:text-primary-alt">
        Dallas &copy; {new Date().getFullYear()}
      </Link>
    </footer>
  )
}

export default Footer
