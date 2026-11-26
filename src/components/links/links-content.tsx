import { useState } from "react"
import { Search } from "lucide-react"

import type { ArticleHeading } from "@/lib/server/articles"
import { Input } from "@/components/ui/input"
import { TextLink } from "@/components/ui/text-link"
import { MobileSectionDropdown } from "@/components/articles/article-toc"
import Container from "@/components/container"
import Header, { SectionHeading } from "@/components/header"
import HeadingAnchor from "@/components/heading-anchor"
import LinkCard from "@/components/links/link-card"
import { LINK_CATEGORIES } from "@/config/student-links"

export const linkHeadings: ArticleHeading[] = LINK_CATEGORIES.map(
  ({ id, title }) => ({
    id,
    depth: 2,
    text: title
  })
)

interface Props {
  /**
   * Rendered as the second grid column, passed in so the ArticleToc island can
   * be controlled independently from the .astro page.
   */
  children?: React.ReactNode
}

const LinksContent = ({ children }: Props) => {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const visible = LINK_CATEGORIES.map((c) => ({
    ...c,
    links: c.links.filter(
      ({ name, desc }) =>
        !q || `${name} ${desc} ${c.title}`.toLowerCase().includes(q)
    )
  })).filter((c) => c.links.length > 0)

  return (
    <Container size="md">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,48rem)_16rem]">
        <div className="space-y-8">
          <MobileSectionDropdown headings={linkHeadings} />

          <Header
            title="Student links"
            subtitle="Quick links to the most-used NTU student portals, from course registration and grades to career, exchange, and campus facilities."
          />

          <p className="text-muted-foreground text-sm">
            Not sure what each portal does?{" "}
            <TextLink href="/articles/ntu-student-portal-links">
              Read the full guide
            </TextLink>{" "}
            for a breakdown of every portal and when to use it.
          </p>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search links, e.g. fees, library, email"
              aria-label="Search links"
              className="pl-9"
            />
          </div>

          <div className="space-y-10">
            {visible.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No links match &ldquo;{query.trim()}&rdquo;.
              </p>
            )}
            {visible.map(({ id, title, type, links }) => (
              <section id={id} key={id} className="scroll-mt-20 space-y-4">
                <div className="space-y-0.5">
                  <SectionHeading>
                    {title}
                    <HeadingAnchor id={id} label={title} />
                  </SectionHeading>
                  <p className="text-muted-foreground text-xs">
                    {type === "internal"
                      ? "NTUMods (unofficial)"
                      : "Official NTU portal"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {links.map(({ name, href, desc }) => (
                    <LinkCard
                      key={name}
                      name={name}
                      href={href}
                      desc={desc}
                      external={type === "external"}
                      category={title}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {children}
      </div>
    </Container>
  )
}

export default LinksContent
