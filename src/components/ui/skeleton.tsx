import { cn } from "@/lib/utils"

// Translucent on purpose: it darkens whatever it sits on, page or card, in
// both themes, so no caller needs its own placeholder colour.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-foreground/10 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
