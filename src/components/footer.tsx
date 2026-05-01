import Link from "next/link"

const Footer = () => {
  return (
    <footer className="text-muted-foreground mt-6 flex h-12 items-center justify-center gap-4 text-center text-sm">
      <Link
        href="/privacy"
        className="hover:text-primary-alt transition-colors">
        Privacy
      </Link>

      <Link
        href="/changelog"
        className="hover:text-primary-alt transition-colors">
        Changelog
      </Link>

      <Link
        href="/settings#feedback"
        className="hover:text-primary-alt transition-colors">
        Report an Issue
      </Link>

      <Link
        href="/settings#feedback"
        className="hover:text-primary-alt transition-colors">
        Dallas &copy; {new Date().getFullYear()}
      </Link>
    </footer>
  )
}

export default Footer
