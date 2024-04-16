import Link from "next/link"

import { siteConfig } from "@/config/site"

const Footer = () => {
  return (
    <footer className="flex h-12 items-center justify-center gap-4 text-center text-sm text-muted-foreground">
      <Link
        href="/privacy"
        className="transition-colors hover:text-primary-alt">
        Privacy
      </Link>

      {/* TODO: finish below */}
      <Link
        href="/settings#feedback"
        className="transition-colors hover:text-primary-alt">
        Report an Issue
      </Link>

      <Link
        href={siteConfig.links.github}
        target="_blank"
        className="transition-colors hover:text-primary-alt">
        Dallas &copy; 2024
      </Link>

      <Link
        href={siteConfig.links.contribute}
        target="_blank"
        className="transition-colors hover:text-primary-alt">
        Contribute
      </Link>
    </footer>
  )
}

export default Footer
