import Link from "next/link"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

interface Props {
  className?: React.HTMLAttributes<HTMLDivElement>["className"]
}
export default function Footer({ className }: Props) {
  return (
    <footer
      className={cn(
        "flex justify-center gap-4 text-center text-sm text-slate-500",
        className
      )}>
      <Link href="/privacy" className="hover:text-slate-400">
        Privacy
      </Link>

      <Link
        href={siteConfig.links.github}
        target="_blank"
        className="hover:text-slate-400">
        Dallas &copy; 2024
      </Link>
    </footer>
  )
}
