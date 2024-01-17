import Link from "next/link"

import { siteConfig } from "@/config/site"

const Footer = () => {
  return (
    <footer className="flex h-12 items-center justify-center gap-4 text-center text-sm text-secondary">
      <Link
        href="/privacy"
        className="transition-colors hover:text-secondary-foreground">
        Privacy
      </Link>

      {/* TODO: finish below */}
      <Link
        href="/settings"
        className="transition-colors hover:text-secondary-foreground">
        Report an Issue
      </Link>

      <Link
        href={siteConfig.links.github}
        target="_blank"
        className="transition-colors hover:text-secondary-foreground">
        Dallas &copy; 2024
      </Link>
    </footer>
  )
}

export default Footer
