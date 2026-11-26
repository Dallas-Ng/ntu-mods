"use client"

import {
  Bell,
  Menu as MenuIcon,
  MessageSquare,
  Moon,
  Sun,
  X
} from "lucide-react"

import { siteConfig } from "@/config/site"
import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { useChangelogUnseenCount } from "@/hooks/use-changelog-unseen"
import { usePathname } from "@/hooks/use-pathname"
import { useTheme } from "@/hooks/use-theme"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLinkIcon, LinkArrow } from "@/components/ui/text-link"
import { NewBadge, NewDot } from "@/components/new-dot"

import { formatCount, useDataStatus, useSemesterWeek } from "./data-status"
import { NAV_MENUS, type Menu, type MenuLink } from "./menus"
import { isActive, NEW_DOTS } from "./nav-shared"

const linkProps = (
  link: { href: string; external?: boolean },
  menu: string
) => ({
  href: link.href,
  ...(link.external && { target: "_blank", rel: "noopener noreferrer" }),
  onClick: () =>
    track("nav_menu_clicked", { menu, href: link.href, source: "mobile" })
})

/** This semester's module count, fetched once a menu with counts opens. */
const Count = ({ category }: { category: string }) => {
  const { status, failed } = useDataStatus()
  if (failed) return null
  if (!status) return <Skeleton className="h-5 w-9 rounded-full" />
  const value = status.categories[category]
  if (!value) return null
  return (
    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
      {formatCount(value)}
    </span>
  )
}

const Meta = ({ link }: { link: MenuLink }) => {
  const week = useSemesterWeek()
  const text = (link.liveWeek && week) || link.meta
  if (!text) return null
  return <span className="text-muted-foreground block text-xs">{text}</span>
}

/** One row: icon, name, one line, and a count or "Guide" on the right. */
const Row = ({ link, menu }: { link: MenuLink; menu: string }) => {
  const Icon = link.icon
  return (
    <li className="flex items-center gap-1">
      <DrawerClose asChild>
        <a
          {...linkProps(link, menu)}
          className="hover:bg-accent flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors">
          {Icon && (
            <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{link.label}</span>
              {link.isNew && <NewBadge />}
              {link.external && <ExternalLinkIcon className="size-3" />}
            </span>
            {link.desc && (
              <span className="text-muted-foreground line-clamp-2 text-xs">
                {link.desc}
              </span>
            )}
            <Meta link={link} />
          </span>
          {link.count && <Count category={link.count} />}
        </a>
      </DrawerClose>
      {link.guide && (
        <DrawerClose asChild>
          <a
            {...linkProps(link.guide, menu)}
            className="text-primary shrink-0 px-2 py-3 text-xs font-medium underline-offset-4 hover:underline">
            {link.guide.label}
          </a>
        </DrawerClose>
      )}
    </li>
  )
}

/** Short labels side by side, for places on the map. */
const Tile = ({ link, menu }: { link: MenuLink; menu: string }) => {
  const Icon = link.icon
  return (
    <li>
      <DrawerClose asChild>
        <a
          {...linkProps(link, menu)}
          className="bg-muted hover:bg-accent flex h-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors">
          {Icon && (
            <Icon
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden
            />
          )}
          <span className="min-w-0">{link.label}</span>
        </a>
      </DrawerClose>
    </li>
  )
}

/** A dropdown's contents, stacked: links, the side list as chips, see all. */
const MenuBody = ({ menu, name }: { menu: Menu; name: string }) => (
  <div className="space-y-3">
    {menu.kind === "list" && menu.columns === 2 ? (
      <ul className="grid grid-cols-2 gap-2 px-2">
        {menu.items.map((link) => (
          <Tile key={link.href} link={link} menu={name} />
        ))}
      </ul>
    ) : (
      <ul>
        {menu.items.map((link) => (
          <Row key={link.href} link={link} menu={name} />
        ))}
      </ul>
    )}

    {menu.aside && (
      <div className="px-2">
        <p className="text-muted-foreground pb-2 text-xs font-medium">
          {menu.aside.title}
        </p>
        <ul className="flex flex-wrap gap-2">
          {menu.aside.items.map((link) => {
            const Icon = link.icon
            return (
              <li key={link.href}>
                <DrawerClose asChild>
                  <a
                    {...linkProps(link, name)}
                    className="bg-muted hover:bg-accent flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors">
                    {Icon && (
                      <Icon
                        className="text-muted-foreground size-4"
                        aria-hidden
                      />
                    )}
                    {link.label}
                    {link.external && <ExternalLinkIcon className="size-3" />}
                  </a>
                </DrawerClose>
              </li>
            )
          })}
        </ul>
      </div>
    )}

    {menu.footer && (
      <DrawerClose asChild>
        <a
          {...linkProps(menu.footer, name)}
          className="group hover:bg-accent text-muted-foreground flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition-colors">
          {menu.footer.label}
          <LinkArrow />
        </a>
      </DrawerClose>
    )}
  </div>
)

const sectionClass = (active: boolean) =>
  cn(
    "relative text-sm font-semibold",
    active ? "text-foreground" : "text-muted-foreground"
  )

/**
 * The phone menu: every top-level item, with the same menus as the desktop
 * dropdowns as sections that expand in place. The section of the current page
 * starts open.
 */
const MobileNav = () => {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const changelogUnseen = useChangelogUnseenCount()
  const current = siteConfig.navLinks.find(
    (l) => NAV_MENUS[l.route] && isActive(pathname, l.route)
  )?.route

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button
          aria-label="Open navigation menu"
          size="icon"
          variant="ghost"
          className="md:hidden">
          <MenuIcon className="size-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent
        aria-describedby={undefined}
        className="flex flex-col p-0 data-[vaul-drawer-direction=right]:w-[min(24rem,90vw)] data-[vaul-drawer-direction=right]:sm:max-w-none">
        <DrawerTitle className="sr-only">Navigation menu</DrawerTitle>

        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <DrawerClose asChild>
            <a href="/" className="flex items-center gap-2">
              <img
                src="/logo.webp"
                alt="Logo"
                width={24}
                height={24}
                className="size-6 object-contain"
              />
              <span className="font-bold">{siteConfig.name}</span>
            </a>
          </DrawerClose>
          <DrawerClose asChild>
            <Button size="icon" variant="ghost" aria-label="Close menu">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        </div>

        <nav
          aria-label="Site menu"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          <Accordion type="single" collapsible defaultValue={current}>
            {siteConfig.navLinks.map((link) => {
              const menu = NAV_MENUS[link.route]
              const active = isActive(pathname, link.route)
              const dot = NEW_DOTS[link.route] && (
                <NewDot
                  storageKey={NEW_DOTS[link.route]}
                  triggerRoute={link.route}
                  className="relative ml-1.5 inline-flex h-2 w-2"
                />
              )

              if (!menu) {
                return (
                  <DrawerClose key={link.route} asChild>
                    <a
                      href={link.route}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        sectionClass(active),
                        "hover:bg-accent flex items-center rounded-lg px-3 py-3 transition-colors"
                      )}>
                      {link.label}
                      {dot}
                    </a>
                  </DrawerClose>
                )
              }

              return (
                <AccordionItem
                  key={link.route}
                  value={link.route}
                  className="border-b-0">
                  <AccordionTrigger
                    headingAs="h2"
                    className={cn(
                      sectionClass(active),
                      "hover:bg-accent items-center rounded-lg px-3 py-3 hover:no-underline"
                    )}>
                    <span className="flex items-center">
                      {link.label}
                      {dot}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-3">
                    <MenuBody menu={menu} name={link.label} />
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </nav>

        <div className="shrink-0 border-t p-2">
          <DrawerClose asChild>
            <a
              href="/changelog"
              onClick={() =>
                track("changelog_opened", { source: "navbar_mobile_menu" })
              }
              className="hover:bg-accent text-muted-foreground flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors">
              <span className="flex items-center gap-3">
                <Bell className="size-4" />
                Changelog
              </span>
              {changelogUnseen > 0 && (
                <NewBadge>
                  {changelogUnseen > 9 ? "9+" : changelogUnseen}
                </NewBadge>
              )}
            </a>
          </DrawerClose>
          <DrawerClose asChild>
            <a
              href="/feedback"
              className="hover:bg-accent text-muted-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors">
              <MessageSquare className="size-4" />
              Feedback
            </a>
          </DrawerClose>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="hover:bg-accent text-muted-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors">
            {theme === "light" ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default MobileNav
