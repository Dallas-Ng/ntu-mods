import Link from "next/link"

import { siteConfig } from "@/config/site"

const Footer = () => {
  return (
    <footer className="flex h-12 items-center justify-center gap-4 text-center text-sm text-muted-foreground">
      <Link
        href="/privacy"
        className="hover:text-hover-primary transition-colors">
        Privacy
      </Link>

      {/* TODO: finish below */}
      <Link
        href="/settings"
        className="hover:text-hover-primary transition-colors">
        Report an Issue
      </Link>

      <Link
        href={siteConfig.links.github}
        target="_blank"
        className="hover:text-hover-primary transition-colors">
        Dallas &copy; 2024
      </Link>
    </footer>
  )
}

export default Footer
