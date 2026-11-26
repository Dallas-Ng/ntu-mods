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
| Ask before an irreversible action | `ConfirmDialog` (WebMCP tools excepted, see below)                    | `window.confirm()`, `alert()`            |
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
- Fonts are committed subsets (`docs/fonts.md`). Use weights 400, 500, 600 or 700 and `tabular-nums` as the only OpenType feature; another weight, `font-feature-settings` or `font-variation-settings` needs the font script changed first.
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

- The academic calendar (`/calendar`) colours days by meaning, using `WEEK_FILL` and the constants beside it in `components/calendar/calendar-months.tsx`. An ordinary teaching day is a plain `background` chip on the month card, so the days that differ stand out: recess `warning-subtle` with `warning` text, revision and exams `destructive-subtle` with `destructive` text, a holiday `success-subtle` with `success` text (green, as Google Calendar marks holidays). Days outside the semester have no chip. A day only partly affected has a `success` bar under its number, a key event a `primary` bar, and today is a solid `foreground` circle. Recess, exam and holiday cells use an inset ring in their category colour. The Dates to know card uses the same colours as the grid.
- No opacity tints (`bg-muted/50`, `bg-primary/10`). The exceptions are see-through glass (navbar, docs bar, the floating "On this page" button, dialog backdrop), `Skeleton`'s translucent `bg-foreground/10`, and the darker hover of solid buttons (`hover:bg-primary/90`).
- No raw Tailwind palette colours (`emerald-500`, `slate-200`). Exceptions include the exempt areas, `yellow-400` with black text for `NewBadge` and the announcement banner, `yellow-500` on hover for the announcement dismiss button, and `rose-500` for the favourite heart.
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
- A toggle whose state the icon itself shows (the registered module's eye-off) keeps the black on-colour while the state is active.
- Arrows by meaning: `LinkArrow` to go somewhere, `ChevronRight` to open a row in a list, `ExternalLinkIcon` to leave the site, `ChevronDown` to expand. Never a typed arrow.
- No hand-drawn copies of lucide icons; import the component (it works in `.astro` too).

## Hover, focus and cursor

One hover signal per element:

- Surfaces (cards, rows, menu items, chips, option tiles, icon buttons): background to `accent`. The text inside does not change colour.
- White controls on a grey surface (`controlOnCard`): stay white, content turns black, a shadow appears. The accent fill is the card's own hover colour, so it would make them vanish.
- Text-only links (`TextLink`): grey text goes black, black text goes blue, inline links dim.
- Solid buttons: a slightly darker fill. The GitHub stars button uses the foreground colour in dark mode, with a slightly darker hover, so it stands out.
- No lift, scale, opacity or border-colour hovers. A go-to arrow may nudge (`LinkArrow` does this).
- Calendar dates with notes show a tooltip on hover and keyboard focus. Hovering or focusing a Dates to know entry outlines matching days and dims other days to 30% opacity. Directly hovered or focused days keep full opacity, as do all days when the user requests higher contrast.
- Month cards reserve six week rows of square day cells for consistent expanded heights. Dates to know sizes to its own content. Below `md` (48rem), card headings become accordion triggers, Dates to know sits below the months, and week rows use a 3px gap. The current Singapore month starts open before hydration. Below `sm` (40rem), Dates to know also starts open. At `md` and above, the cards sit side by side.
- A tile whose fill is the thing being previewed (the six class boxes in Appearance, under granular control) shows a `ring` on hover instead of an accent fill, since an accent fill would hide the preview.

Focus and cursor:

- Clickable cards get the shared focus ring from `cardVariants({ interactive: true })`; buttons get it from `Button`.
- Every enabled `button`, `[role="button"]`, `summary` and link gets the pointer from `globals.css`. Do not add `cursor-pointer` to them, and never to anything that is not clickable. Menu items, options and labels still need it.
- A clickable element that cannot be a `<button>` (it holds another button) gets `role="button"`, `tabIndex={0}` and Enter/Space handling. A clickable icon is a `<button>` with an `aria-label`, never a `<div onClick>`.

## Dialogs, drawers and side navs

- The one `window.confirm()` left is `confirmWithUser` in `lib/webmcp/handlers.ts`: an assistant's tool call needs a synchronous yes or no from the person before it changes their plans, which a React dialog cannot give.
- `ResponsiveModal` is a dialog on desktop and a bottom drawer on phones. `nested` (the default) is for modals opened from inside another drawer; pass `nested={false}` when opened from the page.
- Tapping the dimmed backdrop closes every drawer (it is a `Drawer.Close`), and opening one moves focus to its panel. Keep both in `ui/drawer.tsx`. A drawer that must not close on a tap (`dismissible={false}`) needs that close guarded there first.
- Phone side navs use `SideNavDrawer`: `side="left"` is a bar naming the current page that opens the section nav; `side="right"` is the square "On this page" button. Where a page has both, put them in one sticky row (`floating={false}`) so they never overlap. `desktopFrom` says from which width the desktop nav replaces them.
- The docs layout builds "On this page" from each page's `h2`s with an `id` (`lib/html-headings.ts`), so a docs section heading needs an `id` and a `HeadingAnchor`.
- The section name in a breadcrumb truncates first; the page name stays whole.

## Navbar

- Top-level items come from `siteConfig.navLinks`. A dropdown's contents live in `components/nav/menus.ts`: `list` menus (icon rows with one line each, for places to go) or `cards` menus (a 2-column grid for things you use: a name, what it does, a fact such as time or "NTU login", and a "Guide" link when a how-to article exists). Either can have a grey side list (`aside`). Every item needs context: no tile with a name alone.
- Numbers in menus (module counts per type) and the semester popover come from `public/data/api/status.json` (built by `scripts/build-static-data.mts`), fetched the first time a menu that shows them opens. Date-dependent text ("Teaching week 5", from `lib/semester-weeks.ts`; "Updated 3 days ago") is set after mount, never during render. The "updated" date (`lib/server/data-updates.ts`, also used by `/developers/freshness`) is the newer of the data files' git date and the newest changelog release with a "Data" item; CI clones are shallow, so there only the changelog counts. A data refresh needs a "Data" changelog item for the date to move.
- Panels size to their content. Each column has a floor and a ceiling in `mega-menu.tsx` (list columns 15 to 18rem, cards 15rem, side lists 12 to 14rem), so a short menu does not look cramped and a long description truncates. The navbar measures the open panel and places it under its trigger, 16px inside the window.
- Breakpoints: below `sm` the bar shows the logo and wordmark only, with every item in the menu drawer. From `sm` the items that fit show beside the logo; from `md` the rest move under "More" and the drawer button goes. Order `navLinks` by importance, since the last items are the first to go.
- Desktop links are visible on first paint and use the site's preloaded Inter font. The row clips overflow until the first measurement. Overflow items retain measurable widths outside the row, so the fit updates as fonts load and when the window is resized.
- The phone drawer (`components/nav/mobile-nav.tsx`) renders the same `menus.ts` entries as accordion sections, with the current page's section open: list rows stay rows (descriptions wrap to two lines), two-column menus become tiles, the side list becomes chips. A menu change shows on both.

## Layering

| Layer   | What                                                 |
| ------- | ---------------------------------------------------- |
| `z-60`  | The iOS toolbar tint strip (`.toolbar-edge`)         |
| `z-50`  | Dialogs, drawers, popovers and their backdrops       |
| `z-20`  | The floating "On this page" button                   |
| `z-10`  | The navbar                                           |
| `z-[5]` | The sticky docs bar (it must slide under the navbar) |

A component that uses `z-index` inside itself creates its own stacking context (`isolate`, as `CodeBlock` does), so its layers cannot rise above the navbar or the sticky bars.

The strip is the only element above dialogs that touches the top edge (toasts are higher, but start 80px down). iOS Safari mostly ignores `theme-color` and takes the status bar and toolbar colour from the topmost solid element at the middle of the top edge of the page. A dimming layer is skipped and pixel-sampled instead, and that sample sticks, so the strip has to sit above the scrim. Its colour is the page background mixed with any open scrim, all in `globals.css`, and it has to stay opaque: a translucent strip is pixel-sampled instead. It reads the page colour only, never the banner, so the toolbar does not change colour as the banner scrolls away. The scrim has to switch in the same frame as the strip: Safari samples the strip once per change, so a scrim fade leaves the toolbar on the old colour until the fade ends. That is why the drawer and dialog overlays have no fade. It is shown on iOS only (`@supports not (-webkit-touch-callout: none)` hides it elsewhere), because on other browsers it is a visible 5px band over the top of the page. Mount it once in `BaseLayout`; a modal `<dialog>` needs its own copy inside it, because the top layer paints above everything (the article lightbox does this, and gives up 5px at the top of the image for it). Do not put a transparent, full-viewport fixed layer above the strip: Safari samples pixels again and caches a stale colour. Do not put a background or `backdrop-filter` on anything else fixed or sticky at the top edge either: Safari samples those too, so the navbar's glass lives on an absolute child, which it ignores.

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

- A feature added to Appearance is pointed out with a yellow pulse (`PulseDot`) on its toolbar button, and a "New" badge on its row in the phone Tools drawer, until the student next opens Appearance. Move `APPEARANCE_FEATURE_RELEASED` in `src/config/appearance-settings.ts` to the feature's release date to show it again. The Granular control row has its own pulse, cleared when the student turns it on or opens its (i) guide (screenshots in `public/appearance`, a light and a dark `.webp` each).
