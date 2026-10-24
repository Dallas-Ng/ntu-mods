# Design rules

Part of [NTUMods](../README.md). Read this before changing anything visible. Every rule here was applied across the site; breaking one brings back an inconsistency someone already fixed. If a rule does not fit your case, change the rule here in the same change and say why, rather than working around it in one file.

Exempt everywhere unless a rule says otherwise: the timetable grid (and its miniature previews in settings and on `/tools`), the campus map (including the map guide's copies of map controls), the landing page's illustrations and display headings, and brand logos in `brand-icons.tsx`. They have fixed space or their own interaction model.

## Use the shared piece

Never copy a shared piece's classes into a page. If it cannot do what you need, add a variant or prop to it.

| Need                              | Use                                                                   | Not                                      |
| --------------------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| Page title                        | `Header` (`title`, `subtitle`, `eyebrow`)                             | Your own `<h1>`                          |
| Section / sub-section heading     | `SectionHeading` (h2), `SectionHeading as="h3"`                       | `<h2 className="text-xl …">`             |
| Link in text or a list            | `TextLink` (`default`, `muted`, `action`, `subtle`)                   | `<a className="underline …">`            |
| Button that reads as a link       | `textLinkVariants()` on the `<button>`                                | Copied link classes                      |
| Link that looks like a button     | `buttonVariants()` on the `<a>` (`xl` for the landing page)           | `bg-primary h-12 rounded-md …`           |
| Card                              | `cardVariants()`; `cardVariants({ interactive: true })` if clickable  | `bg-muted hover:bg-accent rounded-2xl …` |
| White button on a grey card       | `controlOnCard`                                                       | `bg-background hover:bg-accent`          |
| "Read the guide" at a card's foot | `CardCta` (parent needs `group`)                                      | Text plus a typed arrow                  |
| Go-to arrow                       | `LinkArrow`, or `TextLink arrow`                                      | `→`, `›`, a bare `ArrowRight`            |
| Link that leaves the site         | `ExternalLinkIcon`                                                    | `ExternalLink`, `↗`                      |
| Inline code                       | `InlineCode` (articles and dev docs get it from CSS)                  | `<code className="bg-muted …">`          |
| Copy to clipboard                 | `CopyButton` (`label` for "Copy"/"Copied")                            | Your own clipboard state                 |
| Dialog                            | `ResponsiveModal` with `modal-parts` (`ModalSection`, `ModalFooter`…) | Raw `Dialog` or `Drawer`                 |
| Ask before an irreversible action | `ConfirmDialog`                                                       | `window.confirm()`, `alert()`            |
| Notice on a page                  | `Alert` (`warning`, `destructive`); `role="note"` if not urgent       | A coloured `div`                         |
| Note inside a dialog              | `ModalNote` (`danger` for errors)                                     | A coloured `p`                           |
| "New" pill or unseen count        | `NewBadge` (`sm`, `md`, `lg`)                                         | `bg-yellow-400 rounded-full …`           |
| "On this page" nav                | `ArticleToc` + `MobileSectionDropdown`                                | A new table of contents                  |
| Section nav on phones             | `SideNavDrawer`                                                       | `<details>` or a floating button         |
| Side nav link styles              | `sideNavLabel`, `sideNavItem` from `ui/side-nav.ts`                   | Your own active state                    |
| Loading placeholder               | `Skeleton` with no colour class                                       | `bg-foreground/10 dark:bg-background`    |

All of these live in `src/components/ui/` except `Header` and `SectionHeading` (`components/header.tsx`), `NewBadge` (`components/new-dot.tsx`) and `ArticleToc` (`components/articles/article-toc.tsx`). React components render fine in `.astro` files without a `client:` directive; pass `className`, not `class`, and never pass JSX as a prop from Astro (it arrives as an object and breaks the render).

## Type

Five sizes, each with one job:

| Size             | Use                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| 30px `text-3xl`  | Page title, through `Header` only                                                                |
| 20px `text-xl`   | Section heading (`SectionHeading`)                                                               |
| 16px `text-base` | Sub-heading and card title (`SectionHeading as="h3"`), the line under a page title, article text |
| 14px `text-sm`   | Default: body text, descriptions, buttons, navigation, table cells, form labels                  |
| 12px `text-xs`   | Secondary details only: hints under a field, captions, dates, counts, small uppercase labels     |

- No other sizes and no `text-[13px]`. The only off-scale exception outside the exempt areas is `NewBadge`'s 10px `sm` size.
- A grey description of something is 14px; a hint or footnote is 12px.
- Inputs, textareas and the command search are 16px on phones (iOS Safari zooms into anything smaller) and 14px from `md`. The placeholder always matches the typed text; never set a separate `placeholder:text-*` size.

## Colour

Two text colours:

- `text-foreground` (black, white in dark mode): what people read. Headings, body text, FAQ answers, legal text, values, labels, the active nav item.
- `text-muted-foreground` (grey): what supports it. The line under a title, card descriptions, hints, captions, dates, counts, inactive nav items, icons.

No in-between shades (`text-foreground/70`). Text on a tint is black or the tint's own colour. Every text pair in `globals.css` is at least 4.5:1; check a new token pair before adding it.

Surfaces are fixed tokens:

| Token                                                            | Use                                         |
| ---------------------------------------------------------------- | ------------------------------------------- |
| `background`                                                     | The page                                    |
| `muted`                                                          | Cards, inline code, chips                   |
| `accent`                                                         | Hover and pressed                           |
| `card` / `popover`                                               | Things that float: dialogs, menus, popovers |
| `primary-subtle`                                                 | Blue callouts, active and selected items    |
| `success`, `warning`, `destructive` (each with a `-subtle` fill) | Status: alerts, changelog tags, API status  |

- No opacity tints (`bg-muted/50`, `bg-primary/10`). The exceptions are see-through glass (navbar, docs bar, the floating "On this page" button, dialog backdrop), `Skeleton`'s translucent `bg-foreground/10`, and the darker hover of solid buttons (`hover:bg-primary/90`).
- No raw Tailwind palette colours (`emerald-500`, `slate-200`). Exceptions: the exempt areas, the yellow `NewBadge`, the yellow banner, and the favourite heart's `rose-500` (a state colour, not an error).
- Light and dark mode both have to work. The theme is class-based (`localStorage.theme`), not the system setting.

## Borders

Borders mean something. Use them for:

- tables (always),
- form controls and the `outline` button,
- floating layers (dialogs, menus, popovers, sticky bars, the consent banner),
- dashed drop zones and empty placeholders,
- keyboard keys (`kbd`).

Everything else (cards, chips, inline code, callouts, alerts, tags, option tiles, the `secondary` button) has no border and is told apart by its fill. Dividers between rows or sections are fine.

## Shape and spacing

- Cards are `rounded-2xl`, set by `cardVariants`. Big section panels may use `rounded-3xl` and small inner tiles `rounded-lg`; nothing else overrides it.
- Card padding is the caller's choice (`p-4` or `p-5` for most).
- Page widths: full for the apps (timetable, mods, map), `md` for browse pages (articles, exams, tools, FAQ, links, changelog, sitemap), `sm` for reading pages (feedback, privacy, terms).
- Top-level page sections are `space-y-8` apart.
- The developer docs use `DevDocsLayout`: a 12rem nav, a centred content column capped at 48rem, and a 14rem "On this page" column from `xl`.

## Icons

Lucide only, stroke 2, sized by context:

| Size     | Use                                                          |
| -------- | ------------------------------------------------------------ |
| `size-3` | Beside 12px text                                             |
| `size-4` | Default: beside 14px text, buttons, menus, icon-only buttons |
| `size-5` | Leading icon of a card, panel or empty state                 |
| `size-6` | Drop zones and landing display only                          |

- No `size-3.5`; pick 3 or 4 by the text beside it.
- Icon-only buttons show a grey icon that turns black on hover. A state colour (blue for in your timetable, red for a favourite) replaces the grey.
- Arrows by meaning: `LinkArrow` to go somewhere, `ChevronRight` to open a row in a list, `ExternalLinkIcon` to leave the site, `ChevronDown` to expand. Never a typed arrow.
- No hand-drawn copies of lucide icons; import the component (it works in `.astro` too).

## Hover, focus and cursor

One hover signal per element:

- Surfaces (cards, rows, menu items, chips, option tiles, icon buttons): background to `accent`. The text inside does not change colour.
- White controls on a grey surface (`controlOnCard`): stay white, content turns black, a shadow appears. The accent fill is the card's own hover colour, so it would make them vanish.
- Text-only links (`TextLink`): grey text goes black, black text goes blue, inline links dim.
- Solid buttons: a slightly darker fill.
- No lift, scale, opacity or border-colour hovers. A go-to arrow may nudge (`LinkArrow` does this).

Focus and cursor:

- Clickable cards get the shared focus ring from `cardVariants({ interactive: true })`; buttons get it from `Button`.
- Every enabled `button`, `[role="button"]`, `summary` and link gets the pointer from `globals.css`. Do not add `cursor-pointer` to them, and never to anything that is not clickable. Menu items, options and labels still need it.
- A clickable element that cannot be a `<button>` (it holds another button) gets `role="button"`, `tabIndex={0}` and Enter/Space handling. A clickable icon is a `<button>` with an `aria-label`, never a `<div onClick>`.

## Dialogs, drawers and side navs

- `ResponsiveModal` is a dialog on desktop and a bottom drawer on phones. `nested` (the default) is for modals opened from inside another drawer; pass `nested={false}` when opened from the page.
- Tapping the dimmed backdrop closes every drawer (it is a `Drawer.Close`), and opening one moves focus to its panel. Keep both in `ui/drawer.tsx`.
- Phone side navs use `SideNavDrawer`: `side="left"` is a bar naming the current page that opens the section nav; `side="right"` is the square "On this page" button. Where a page has both, put them in one sticky row (`floating={false}`) so they never overlap. `desktopFrom` says from which width the desktop nav replaces them.
- The docs layout builds "On this page" from each page's `h2`s with an `id` (`lib/html-headings.ts`), so a docs section heading needs an `id` and a `HeadingAnchor`.
- The section name in a breadcrumb truncates first; the page name stays whole.

## Layering

| Layer   | What                                                 |
| ------- | ---------------------------------------------------- |
| `z-50`  | Dialogs, drawers, popovers and their backdrops       |
| `z-20`  | The floating "On this page" button                   |
| `z-10`  | The navbar                                           |
| `z-[5]` | The sticky docs bar (it must slide under the navbar) |

A component that uses `z-index` inside itself creates its own stacking context (`isolate`, as `CodeBlock` does), so its layers cannot rise above the navbar or the sticky bars.

## Copy

- Sentence case for every heading, label, button and dialog title. Title Case only for names: article titles, tools ("CGPA Planner"), documents ("Privacy Policy", "Terms of Use").
- No em dashes. Use a colon, a comma or two sentences.
- Toasts: `toast.success` for a done action in "Thing done" form ("Link copied", "Duplicated to Plan 2"); `toast.error` with "Could not … ." or "Something went wrong. Try again later."; `toast.info` for hints ("Add modules to your timetable first"). One sentence has no full stop; two sentences do.
- Links to official NTU pages are checked live before they are added; do not write a URL from memory.

## Before you finish a UI change

1. Searched for an existing shared piece before writing classes?
2. Only scale sizes, two text colours, token surfaces, no stray borders?
3. Hover, focus and cursor follow the rules above; keyboard can reach and see it?
4. Checked in the browser, light and dark, desktop and phone width (`pnpm db:seed-local` first, see `CLAUDE.md`)?
5. Copy: sentence case, no em dashes?
6. A new rule or exception? Update this file in the same change.
