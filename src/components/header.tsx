import { cn } from "@/lib/utils"

interface Props {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  /** Small label above the title, e.g. the section the page sits in. */
  eyebrow?: React.ReactNode
  className?: string
}

/** The page title block. Every page's visible h1 goes through this. */
const Header = (props: Props) => {
  const { title, subtitle, eyebrow, className } = props

  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow !== undefined && (
        <p className="text-sm font-semibold">{eyebrow}</p>
      )}

      <h1 className="text-3xl leading-[1] font-semibold break-words">
        {title}
      </h1>

      {subtitle !== undefined && (
        <p className="text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

/**
 * A heading inside the page: h2 for sections (20px), h3 for sub-sections and
 * card titles (16px). The page title (30px) is Header.
 */
export const SectionHeading = ({
  as: Tag = "h2",
  className,
  ...props
}: React.ComponentProps<"h2"> & { as?: "h2" | "h3" }) => (
  <Tag
    className={cn(
      "scroll-mt-28 font-semibold",
      Tag === "h2" ? "text-xl tracking-tight" : "text-base",
      className
    )}
    {...props}
  />
)

export default Header
