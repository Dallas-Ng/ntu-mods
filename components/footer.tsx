import Link from "next/link"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

interface Props {
  className?: React.HTMLAttributes<HTMLDivElement>["className"]
}
export default function Footer({ className }: Props) {
  return (
    <footer className={cn("flex justify-center gap-4", className)}>
      <div className="text-center text-sm text-slate-500 transition-colors duration-300 hover:text-slate-400">
        <Link href="/privacy">Privacy</Link>
      </div>

      <div className="text-center text-sm text-slate-500 transition-colors duration-300 hover:text-slate-400">
        <Link href={siteConfig.links.github} target="_blank">
          Dallas &copy; 2024
        </Link>
      </div>
    </footer>
  )
}
