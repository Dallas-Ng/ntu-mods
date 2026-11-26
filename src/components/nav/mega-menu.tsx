"use client"

import { NavigationMenu } from "radix-ui"

import { track } from "@/lib/analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLinkIcon, LinkArrow } from "@/components/ui/text-link"
import { NewBadge } from "@/components/new-dot"

import {
  formatCount,
  useDataStatus,
  useSemesterWeek,
  type DataStatus
} from "./data-status"
import type { CardMenu, ListMenu, Menu, MenuAside, MenuLink } from "./menus"

const linkProps = (
  link: { href: string; external?: boolean },
  menu: string
) => ({
  href: link.href,
  ...(link.external && { target: "_blank", rel: "noopener noreferrer" }),
  onClick: () => track("nav_menu_clicked", { menu, href: link.href })
})

const IconChip = ({ link, tone }: { link: MenuLink; tone: "row" | "card" }) => {
  if (!link.icon) return null
  const Icon = link.icon
  return (
    <span
      className={
        tone === "row"
          ? "bg-muted text-muted-foreground group-hover:bg-background flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          : "bg-background text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
      }>
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium">
    {children}
  </p>
)

/** This semester's module count for a row, a skeleton while it loads. */
const Count = ({
  category,
  status,
  failed
}: {
  category: string
  status: DataStatus | null
  failed: boolean
}) => {
  if (failed) return null
  if (!status) return <Skeleton className="h-5 w-9 rounded-full" />
  const value = status.categories[category]
  if (!value) return null
  return (
    <span className="bg-muted text-muted-foreground group-hover:bg-background rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition-colors">
      {formatCount(value)}
    </span>
  )
}

// Columns size to their content between a floor, so a short menu does not
// look cramped, and a ceiling, past which descriptions truncate.
const ListPanel = ({ menu, name }: { menu: ListMenu; name: string }) => (
  <div className={menu.columns === 2 ? "max-w-[30rem]" : "max-w-72 min-w-60"}>
    <SectionLabel>{menu.title}</SectionLabel>
    <ul
      className={
        menu.columns === 2
          ? "grid grid-cols-[repeat(2,minmax(12rem,1fr))]"
          : undefined
      }>
      {menu.items.map((link) => (
        <li key={link.href}>
          <NavigationMenu.Link asChild>
            <a
              {...linkProps(link, name)}
              className="group hover:bg-accent flex items-center gap-3 rounded-lg p-2 transition-colors">
              <IconChip link={link} tone="row" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {link.label}
                  {link.isNew && <NewBadge />}
                </span>
                {link.desc && (
                  <span className="text-muted-foreground block truncate text-xs">
                    {link.desc}
                  </span>
                )}
              </span>
              {link.count && <RowCount category={link.count} />}
            </a>
          </NavigationMenu.Link>
        </li>
      ))}
    </ul>
  </div>
)

// Its own component so only menus with counts fetch status.json.
const RowCount = ({ category }: { category: string }) => {
  const { status, failed } = useDataStatus()
  return <Count category={category} status={status} failed={failed} />
}

/** Live text that depends on today's date; rendered only in the browser. */
const CardMeta = ({ link }: { link: MenuLink }) => {
  const week = useSemesterWeek()
  const text = (link.liveWeek && week) || link.meta
  if (!text) return null
  return <span className="text-muted-foreground truncate text-xs">{text}</span>
}

const CardPanel = ({ menu, name }: { menu: CardMenu; name: string }) => (
  <div>
    <SectionLabel>{menu.title}</SectionLabel>
    <ul className="grid grid-cols-[repeat(2,15rem)] gap-2">
      {menu.items.map((link) => (
        // The card is not a link itself: its title link stretches over it
        // (after:inset-0), and the guide link sits above that layer.
        <li
          key={link.href}
          className="bg-muted hover:bg-accent relative flex h-full flex-col gap-3 rounded-xl p-3 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <IconChip link={link} tone="card" />
            {link.isNew && <NewBadge />}
            {link.external && <ExternalLinkIcon />}
          </div>
          <div className="min-w-0 flex-1">
            <NavigationMenu.Link asChild>
              <a
                {...linkProps(link, name)}
                className="focus-visible:ring-ring/50 text-sm font-semibold outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px]">
                {link.label}
              </a>
            </NavigationMenu.Link>
            {link.desc && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {link.desc}
              </p>
            )}
          </div>
          {(link.meta || link.liveWeek || link.guide) && (
            <div className="flex items-center justify-between gap-2">
              <CardMeta link={link} />
              {link.guide && (
                <NavigationMenu.Link asChild>
                  <a
                    {...linkProps(link.guide, name)}
                    className="text-primary relative z-10 shrink-0 text-xs font-medium underline-offset-4 hover:underline">
                    {link.guide.label}
                  </a>
                </NavigationMenu.Link>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  </div>
)

const Aside = ({ aside, name }: { aside: MenuAside; name: string }) => (
  <div className="bg-muted max-w-56 min-w-48 rounded-xl p-2">
    <p className="text-muted-foreground px-2 pb-1 text-xs font-medium">
      {aside.title}
    </p>
    <ul>
      {aside.items.map((link) => {
        const Icon = link.icon
        return (
          <li key={link.href}>
            <NavigationMenu.Link asChild>
              <a
                {...linkProps(link, name)}
                className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors">
                {Icon && (
                  <Icon className="text-muted-foreground size-4" aria-hidden />
                )}
                <span className="flex-1">{link.label}</span>
                {link.external && <ExternalLinkIcon className="size-3" />}
              </a>
            </NavigationMenu.Link>
          </li>
        )
      })}
    </ul>
  </div>
)

/** One dropdown's panel: its links, a side list, then a "see all" row. */
const MegaMenu = ({ menu, name }: { menu: Menu; name: string }) => (
  <div className="p-2">
    <div className="flex gap-2">
      {menu.kind === "list" ? (
        <ListPanel menu={menu} name={name} />
      ) : (
        <CardPanel menu={menu} name={name} />
      )}
      {menu.aside && <Aside aside={menu.aside} name={name} />}
    </div>
    {menu.footer && (
      <NavigationMenu.Link asChild>
        <a
          href={menu.footer.href}
          onClick={() =>
            track("nav_menu_clicked", { menu: name, href: menu.footer?.href })
          }
          className="group hover:bg-accent text-muted-foreground mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          {menu.footer.label}
          <LinkArrow />
        </a>
      </NavigationMenu.Link>
    )}
  </div>
)

export default MegaMenu
