import type React from "react"

export type ChangelogCategory =
  | "New Feature"
  | "Improvement"
  | "Bug Fix"
  | "Content"
  | "Data"
  | "Performance"

export interface ChangelogItem {
  category: ChangelogCategory
  content: React.ReactNode
}

export interface ChangelogRelease {
  id: string
  title: string
  date: string
  note?: string
  items: ChangelogItem[]
}

const hashRelease = ({
  title,
  date
}: Pick<ChangelogRelease, "title" | "date">): string => {
  const str = `${title}::${date}`
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

export const ChangelogLink = ({
  href,
  children
}: {
  href: string
  children: React.ReactNode
}) => (
  <a
    href={href}
    className="text-primary hover:text-primary/80 transition-colors">
    {children}
  </a>
)

const CHANGELOG_BASE: Omit<ChangelogRelease, "id">[] = [
  {
    title: "New Tools section and the FGO Optimiser",
    date: "8 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            New <ChangelogLink href="/tools">Tools</ChangelogLink> page, with a
            link in the navbar and footer, showing every NTUMods tool as a card.
            It starts with the FGO Optimiser and the existing{" "}
            <ChangelogLink href="/screenshot">Wallpaper Maker</ChangelogLink>.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            <ChangelogLink href="/tools/fgo-optimiser">
              FGO Optimiser
            </ChangelogLink>
            : upload your transcript PDF and see which modules to Flexible-Grade
            for the highest CGPA within your quota and the 12 AU Core, ICC and
            MPE cap. Your transcript is read in your browser and never uploaded.
            Guide:{" "}
            <ChangelogLink href="/articles/ntu-fgo-su-option-guide">
              NTU FGO guide
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "The optimiser counts FGO you have already used. Modules graded Pass are detected from the transcript, and AU from No Record modules, which no longer appear on a transcript, can be added by hand."
      },
      {
        category: "Improvement",
        content:
          "The optimiser shows how much each module would change your CGPA if you Flexible-Graded it, keeps your CGPA and quota visible while you scroll, and has a Try with sample data button."
      },
      {
        category: "Content",
        content: (
          <>
            The{" "}
            <ChangelogLink href="/articles/ntu-fgo-su-option-guide">
              NTU FGO guide
            </ChangelogLink>{" "}
            now opens with a plain definition, adds a Pass vs No Record table
            and new FAQ entries, and links to the optimiser. The{" "}
            <ChangelogLink href="/links">Links</ChangelogLink> page, AI
            instructions, llms.txt and sitemap list the new section too.
          </>
        )
      }
    ]
  },
  {
    title: "Articles, nav, footer and links polish",
    date: "6 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            <ChangelogLink href="/articles">Articles</ChangelogLink> now show
            unique view counts and can be sorted by date or by views.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "The More articles section at the bottom of each article now uses richer cards with a thumbnail, category, reading time and description, plus a View all articles link."
      },
      {
        category: "Improvement",
        content:
          "Tables in articles, this changelog and module info now share one consistent design."
      },
      {
        category: "Improvement",
        content:
          "The desktop navigation bar is easier to use, with settings moved into a compact actions area."
      },
      {
        category: "Improvement",
        content:
          "The footer has been redesigned to look cleaner and more modern."
      },
      {
        category: "Improvement",
        content:
          "Scrollbars now follow the dark theme instead of showing light system styling."
      },
      {
        category: "Content",
        content: (
          <>
            The <ChangelogLink href="/links">Links</ChangelogLink> page now
            includes Course Content, Student Email, NTU Library, Campus Shuttle,
            Housing, Student Wellbeing, Fee Payment, and the IT Helpdesk. All
            links point to official NTU pages.
          </>
        )
      }
    ]
  },
  {
    title: "Mobile timetable rebuilt",
    date: "13 Aug 2026",
    items: [
      {
        category: "Bug Fix",
        content: (
          <>
            The mobile <em>Add mods</em> drawer wasn&apos;t reliably opening,
            and tapping a module to change its index could conflict with it.
            Rebuilt so it opens and closes the way every other drawer in the app
            does, with index picking working correctly inside it.
          </>
        )
      },
      {
        category: "Bug Fix",
        content:
          "Search and note fields on mobile no longer trigger iOS's automatic zoom when tapped."
      },
      {
        category: "Improvement",
        content: (
          <>
            <em>Pick indexes</em> moved from a permanent button on the toolbar
            into the ••• menu, so it no longer competes for space with the rest
            of the toolbar on small screens.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Timetable cells are more compact on mobile by default, regardless of
            your chosen density in{" "}
            <ChangelogLink href="/settings">Settings</ChangelogLink> — which
            still applies from tablet width up.
          </>
        )
      },
      {
        category: "Bug Fix",
        content:
          "Custom block fields (type, day, venue, timing) no longer squeeze into cramped two-column rows on narrow screens."
      }
    ]
  },
  {
    title: "Standardised scale and notes",
    date: "10 Aug 2026",
    items: [
      {
        category: "Bug Fix",
        content: (
          <>
            <ChangelogLink href="/timetable">Timetable</ChangelogLink> blocks
            now reliably colour their whole 30-minute slot, even when the text
            is short — some blocks were only colouring the height of their own
            text, leaving a half-coloured gap next to fully coloured blocks of
            the same length.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            A new <em>Standardised scale</em> table setting locks every
            30-minute row to the same height, so lesson length and break length
            stay visually comparable across the whole grid instead of stretching
            to fit whichever block has the most text.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Registered modules can now carry a personal note — click a module in
            the sidebar to add one, scoped to just that index (e.g. &quot;seat
            near the door&quot; for one tutorial group) or to every index of
            that module. A coloured dot marks which modules have a note, and
            hovering shows it — both in the sidebar and on the block itself.
          </>
        )
      }
    ]
  },
  {
    title: "Generate mode shows every distinct timetable",
    date: "30 Jul 2026",
    items: [
      {
        category: "Bug Fix",
        content: (
          <>
            <ChangelogLink href="/timetable">Generate mode</ChangelogLink> no
            longer wastes its results on look-alikes. It used to stop after 30
            combinations and then hide the duplicates, so if 25 of those 30 put
            your classes in the exact same slots you were left cycling through 5
            timetables — even when far more genuinely different ones existed.
            Uniqueness is now decided while generating, so you get up to 60
            distinct layouts.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            A <em>Unique layouts only</em> switch sits above the Generate
            button, on by default. Turn it off to cycle through every index
            number combination, including ones that share the same timeslots —
            useful when your first-choice index is full and you need a fallback
            that keeps the same schedule.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Generation Settings has a <strong>Reset</strong> button. One click
            restores the defaults — day hours, breaks, blocked slots, relaxed
            class types and any index locks — instead of undoing each setting by
            hand.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "The colour legend and the hidden-information notice now sit directly under the timetable overview rather than in a separate row further down, and the exam disclaimer links to the exams page."
      }
    ]
  },
  {
    title: "NTUMods runs on Astro now",
    date: "28 Jul 2026",
    items: [
      {
        category: "Performance",
        content: (
          <>
            NTUMods is now rebuilt on{" "}
            <a
              href="https://astro.build"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-primary/80 transition-colors">
              Astro
            </a>{" "}
            and now hosted on{" "}
            <a
              href="https://www.cloudflare.com/"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-primary/80 transition-colors">
              Cloudflare
            </a>
            &apos;s global network — pages should feel snappier no matter where
            in the world you&apos;re loading from.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "No visible changes to how you use NTUMods — same features, same layout, just a faster foundation underneath."
      }
    ]
  },
  {
    title: "Custom blocks in generation and sharing",
    date: "27 Jul 2026",
    items: [
      {
        category: "Bug Fix",
        content: (
          <>
            Generate mode no longer ignores custom blocks — it treats them as
            real obstacles and won&apos;t schedule a class on top of your gym,
            CCA or work slot. Your own blocks stay exempt from the day-hours,
            lunch-break and spacing settings, so an early or late block can
            never make generation impossible.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Custom blocks can hold multiple <strong>options</strong> — different
            sets of days and times for the same commitment. Generation picks
            whichever option fits best, just like it picks module indexes.
            Switch options by hand from the sidebar or by clicking the block in
            Pick indexes mode.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Share links can now carry your custom blocks — tick{" "}
            <em>Include custom blocks</em> in the new Share dialog. For long
            timetables, <em>Copy as text</em> gives a code the receiver pastes
            into <em>Import from text</em>, choosing which plan to import into.
          </>
        )
      },
      {
        category: "Bug Fix",
        content:
          "Viewing someone's shared timetable no longer draws your own custom blocks over it."
      }
    ]
  },
  {
    title: "Filter modules by day and time",
    date: "24 Jun 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Filter the{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink> by day
            and time — select which days you&apos;re available and set a time
            window (e.g. no classes after 6pm). Only modules with at least one
            viable index that fits your constraints are shown.
          </>
        )
      }
    ]
  },
  {
    title: "Student links page and custom courses",
    date: "22 Jun 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            New <ChangelogLink href="/links">Links</ChangelogLink> page — quick
            access to the top NTU student portals (STARS, NTULearn, Degree
            Audit, CareerAxis, GEM, and more), split between official NTU
            portals and NTUMods tools.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Add custom courses to your{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> — block
            out personal time slots like gym, lunch, or CCA with a name, colour,
            and venue. Custom blocks appear on the timetable grid and flag
            clashes with registered modules.
          </>
        )
      },
      {
        category: "New Feature",
        content:
          "Custom courses are per-plan — each of your 5 timetable plans has its own set of blocks, and duplicating a plan copies them over."
      },
      {
        category: "Content",
        content: (
          <>
            New guide:{" "}
            <ChangelogLink href="/articles/custom-courses-timetable-ntu">
              How to use custom courses on NTUMods
            </ChangelogLink>{" "}
            — walkthrough with examples for planning personal time alongside
            registered modules.
          </>
        )
      }
    ]
  },
  {
    title:
      "Exam schedule, timetable generator improvements, and module page polish",
    date: "14 Jun 2026",
    note: "All features and improvements in this release are based on feedback from anonymous students. Thank you!",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            New <ChangelogLink href="/exams">Exam Schedule</ChangelogLink> page
            — search AY 2026/2027 Sem 1 exams by module code or name, group by
            date or school, and click any row to go to the module page.
          </>
        )
      },
      {
        category: "Data",
        content: (
          <>
            AY 2026/2027 Sem 1 exam timetable data added — visible on{" "}
            <ChangelogLink href="/exams">the exam page</ChangelogLink> and on
            individual <ChangelogLink href="/mods">module pages</ChangelogLink>.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Restructured{" "}
            <ChangelogLink href="/mods">module detail pages</ChangelogLink> —
            workload moved to the top, additional info collapsed into an
            expandable section, and exam disclaimer added below the timetable
            overview.
          </>
        )
      },
      {
        category: "Bug Fix",
        content:
          'Fixed Roman numerals in module titles being lowercased (e.g. "Iii" → "III") and missing spaces after sentence-ending periods in descriptions — applied retroactively across all semesters.'
      },
      {
        category: "Improvement",
        content:
          "Module descriptions with inline enumerated lists now render as proper bullet lists instead of one unbroken paragraph."
      },
      {
        category: "New Feature",
        content: (
          <>
            Generate timetables from a{" "}
            <ChangelogLink href="/timetable">
              comma-separated list of module codes
            </ChangelogLink>{" "}
            — paste them all at once instead of adding one by one.
          </>
        )
      },
      {
        category: "New Feature",
        content:
          "Lock a specific index for any module before generating — the generator will only consider that registration group."
      },
      {
        category: "New Feature",
        content:
          'Hide duplicate timetable results that share identical timeslots but differ only by index number. Toggle "Hide same-timeslot duplicates" in the results panel.'
      },
      {
        category: "New Feature",
        content: (
          <>
            <ChangelogLink href="/mods">Module pages</ChangelogLink> now include
            an interactive prerequisite graph so you can visualise dependency
            chains at a glance.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "When generation finds no results, the tool now analyses your constraints and suggests the specific setting to relax — instead of a generic error message."
      },
      {
        category: "Improvement",
        content: "Duplicate plan option added to the plan actions dropdown."
      },
      {
        category: "Bug Fix",
        content:
          "Fixed module search input resetting mid-type after the debounce fired."
      }
    ]
  },
  {
    title: "AY 2026 Semester 1 now available",
    date: "29 May 2026",
    items: [
      {
        category: "Data",
        content: (
          <>
            AY 2026 Semester 1 course data is now live — 1,126 courses and 4,842
            indexes available in the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> and{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      },
      {
        category: "New Feature",
        content:
          "Current semester now shown prominently in the navbar and footer."
      },
      {
        category: "Improvement",
        content: (
          <>
            Moved <ChangelogLink href="/faq">Help to /faq</ChangelogLink> with a
            table of contents for quicker navigation.
          </>
        )
      }
    ]
  },
  {
    title: "Articles search, categories, and new guides",
    date: "22 May 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added a search bar and category filter to the{" "}
            <ChangelogLink href="/articles">Articles</ChangelogLink> page.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added{" "}
            <ChangelogLink href="/articles">
              article category pages
            </ChangelogLink>{" "}
            for browsing guides by topic.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Articles now grouped by category in the default{" "}
            <ChangelogLink href="/articles">list view</ChangelogLink>.
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            Published 4 new guides:{" "}
            <ChangelogLink href="/articles/complete-ntu-bde-list">
              complete NTU BDE list
            </ChangelogLink>
            ,{" "}
            <ChangelogLink href="/articles/best-cc-modules-ntu">
              best CC modules
            </ChangelogLink>
            ,{" "}
            <ChangelogLink href="/articles/ntu-module-selection-guide">
              module selection guide
            </ChangelogLink>
            , and{" "}
            <ChangelogLink href="/articles/does-bde-count-towards-degree-ntu">
              whether BDEs count toward your degree
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Bug Fix",
        content: (
          <>
            Fixed a navigation error when browsing{" "}
            <ChangelogLink href="/articles">articles</ChangelogLink> by
            category.
          </>
        )
      }
    ]
  },
  {
    title: "Resources dropdown and mobile navigation",
    date: "21 May 2026",
    items: [
      {
        category: "Improvement",
        content:
          "Replaced the Help link in the navbar with a Resources dropdown grouping Changelog, FAQ, and Sitemap."
      },
      {
        category: "Improvement",
        content:
          "Redesigned mobile navigation with a right-side drawer for easier access."
      },
      {
        category: "Bug Fix",
        content:
          "Fixed timetable onboarding modal not dismissing after initial setup."
      }
    ]
  },
  {
    title: "Timetable modes and index picking",
    date: "21 May 2026",
    items: [
      {
        category: "Improvement",
        content: (
          <>
            Improved index picker focus on the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink>: other
            modules dim heavily when picking, alternate indexes are clearly
            highlighted, and selecting resets immediately for the next pick.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Consolidated screenshot, calendar export, and share into a single{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> actions
            dropdown (•••).
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added a mode selector to the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> —
            Timetable, Generate, and AI modes (generation and AI coming soon).
          </>
        )
      }
    ]
  },
  {
    title: "More BDE guides and navigation",
    date: "20 May 2026",
    items: [
      {
        category: "Content",
        content: (
          <>
            Published 6 new BDE guides covering engineering BDEs, BDE vs minor,
            easy BDEs, bidding, language BDEs, and an expanded overview — all in{" "}
            <ChangelogLink href="/articles">Articles</ChangelogLink>.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added a <ChangelogLink href="/sitemap">Sitemap</ChangelogLink> page
            listing all pages on the site.
          </>
        )
      },
      {
        category: "Improvement",
        content: "Updated footer with better interlinks across site sections."
      }
    ]
  },
  {
    title: "Better timetable planning",
    date: "29 Apr 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added click-to-switch index previews so you can compare class groups
            directly from the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink>.
          </>
        )
      },
      {
        category: "Bug Fix",
        content: (
          <>
            Improved filtering behavior when browsing and selecting indexes in
            the <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Polished mobile responsiveness and visual styling across{" "}
            <ChangelogLink href="/timetable">timetable views</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Articles and planning guides",
    date: "29 Apr 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added an <ChangelogLink href="/articles">Articles</ChangelogLink>{" "}
            section for NTU module planning guides.
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            Published guides for{" "}
            <ChangelogLink href="/articles/ntu-cc-modules-what-they-actually-feel-like">
              common curriculum modules
            </ChangelogLink>
            ,{" "}
            <ChangelogLink href="/articles/what-is-a-bde-at-ntu">
              BDE planning
            </ChangelogLink>
            , and{" "}
            <ChangelogLink href="/articles/most-popular-bdes-at-ntu">
              popular BDE choices
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Added supporting article navigation and reader-friendly{" "}
            <ChangelogLink href="/articles">page layouts</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Feedback and support",
    date: "22 Mar 2026",
    items: [
      {
        category: "Improvement",
        content: (
          <>
            Updated{" "}
            <ChangelogLink href="/settings#feedback">
              feedback submissions
            </ChangelogLink>{" "}
            so reports can be sent by email.
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            Expanded{" "}
            <ChangelogLink href="/faq">FAQ documentation</ChangelogLink> and
            help content.
          </>
        )
      }
    ]
  },
  {
    title: "Data, modules, and exams",
    date: "8 Mar 2026",
    items: [
      {
        category: "Improvement",
        content: (
          <>
            Moved <ChangelogLink href="/mods">module browsing</ChangelogLink>{" "}
            and module detail pages onto API-backed data routes.
          </>
        )
      },
      {
        category: "Data",
        content: (
          <>
            Added exam schedule data where available on{" "}
            <ChangelogLink href="/mods">module pages</ChangelogLink>.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "Simplified semester navigation and derive the latest semester from available data."
      },
      {
        category: "Data",
        content: "Cleaned up older data files and refreshed module/index data."
      }
    ]
  },
  {
    title: "Sharing and exports",
    date: "22 Mar 2026",
    items: [
      {
        category: "Bug Fix",
        content: (
          <>
            Fixed{" "}
            <ChangelogLink href="/timetable">timetable sharing</ChangelogLink>{" "}
            behavior and share button handling.
          </>
        )
      },
      {
        category: "Bug Fix",
        content: (
          <>
            Re-enabled calendar export support from the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> after
            compatibility fixes.
          </>
        )
      },
      {
        category: "Performance",
        content:
          "Improved static data delivery to reduce serverless function usage."
      }
    ]
  },
  {
    title: "Multi-semester support",
    date: "21 Feb 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added multi-year and multi-semester support — browse modules and
            plan timetables across different academic years and semesters in the{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "Current academic year and semester now shown in the page header with no layout shift."
      }
    ]
  },
  {
    title: "AY 2024/2025 data",
    date: "9 Jun 2024",
    items: [
      {
        category: "Data",
        content: (
          <>
            AY 2024/2025 course data added — all modules and indexes available
            in the <ChangelogLink href="/timetable">timetable</ChangelogLink>{" "}
            and <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Workload info and module filtering",
    date: "30 Mar 2024",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added a workload breakdown table to each{" "}
            <ChangelogLink href="/mods">module page</ChangelogLink> showing
            lecture, tutorial, lab, and project hours.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added module level filtering (1000–4000+) to the{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Timetable sharing",
    date: "19 Dec 2023",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Share your{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> with
            friends via a link.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "Indexes are now assigned without clashes automatically when picking modules."
      }
    ]
  }
]

export const CHANGELOG: ChangelogRelease[] = CHANGELOG_BASE.map((release) => ({
  ...release,
  id: hashRelease(release)
}))

export const CHANGELOG_IDS = CHANGELOG.map((release) => release.id)
export const LATEST_CHANGELOG_ID = CHANGELOG_IDS[0]
