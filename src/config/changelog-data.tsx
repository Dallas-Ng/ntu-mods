import type React from "react"

export type ChangelogCategory =
  "New Feature" | "Improvement" | "Bug Fix" | "Content" | "Data" | "Performance"

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
    className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
    {children}
  </a>
)

const CHANGELOG_BASE: Omit<ChangelogRelease, "id">[] = [
  {
    title: "MCP server",
    date: "23 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            NTUMods now runs a public MCP server, so Claude, ChatGPT, Claude
            Code and Cursor can look up modules, class indexes and exams from
            the real data. It is free, read-only and needs no sign-in. Setup
            steps:{" "}
            <ChangelogLink href="/articles/ntu-mods-mcp-server-guide">
              Use NTUMods in Claude and ChatGPT With the MCP Server
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            The{" "}
            <ChangelogLink href="/developers#mcp">
              developers page
            </ChangelogLink>{" "}
            lists every MCP tool with its inputs, the limits and the error
            codes.
          </>
        )
      }
    ]
  },
  {
    title: "Timetable redesign",
    date: "22 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            The <ChangelogLink href="/timetable">timetable</ChangelogLink> page
            has been redesigned. A single toolbar holds every tool, plans can be
            named, the side panel can sit beside or below the grid, and the new
            Appearance dialog changes the radius, density, contrast and colour
            palette. Walking between classes now opens as a map dialog, and the
            shared timetable page uses the same layout with a clearer copy
            dialog. Everything that changed:{" "}
            <ChangelogLink href="/articles/ntu-timetable-planner-redesign">
              NTU Timetable Planner Redesign
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Standardised scale is a new table setting that gives every half hour
            the same height. Save to calendar shows a preview before the
            download, and actions that would overwrite a plan now ask first.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Dialogs become drawers on phones with consistent spacing and
            scrolling, and the page no longer jumps while it loads.
          </>
        )
      }
    ]
  },
  {
    title: "Walking between classes",
    date: "21 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            The <ChangelogLink href="/timetable">timetable</ChangelogLink> page
            now has a Walking between classes button under Generate Timetable.
            Pick a day to see your classes in order on the campus map, the
            walking time between each pair of venues, and a warning when the gap
            is too short. Walks are looked up only when you open it, for one day
            at a time. The Calendar, Generate and AI tabs are gone: generate
            options now show by default. Guide:{" "}
            <ChangelogLink href="/articles/ntu-timetable-planner-guide">
              NTU Timetable Planner Guide
            </ChangelogLink>
            .
          </>
        )
      }
    ]
  },
  {
    title: "Campus map",
    date: "20 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            New <ChangelogLink href="/maps">campus map</ChangelogLink>. Search
            any lecture theatre, tutorial room, hall or canteen, see which level
            it is on with indoor floor plans from Basement 7 to Level 9, and get
            walking directions with times between classes. Switch between
            standard, hybrid and satellite views, browse halls, food, bus stops,
            car parks and toilets, and share a link that opens the exact view.
            Guide:{" "}
            <ChangelogLink href="/articles/ntu-campus-map-guide">
              NTU Campus Map: Find Any Lecture Theatre, Room and Walking Route
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Data",
        content: (
          <>
            Venues from the last two semesters are matched to rooms using the
            official facilities list and room codes. A few are matched by name
            only and are marked as approximate on the map.
          </>
        )
      }
    ]
  },
  {
    title: "Developers page",
    date: "19 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            New{" "}
            <ChangelogLink href="/developers">developers page</ChangelogLink>{" "}
            documents the free module API and the open module, index and exam
            data, with a try-it box and an OpenAPI file for student projects.
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            The <ChangelogLink href="/privacy">privacy policy</ChangelogLink>{" "}
            now covers the public API and AI assistants that use WebMCP.
          </>
        )
      }
    ]
  },
  {
    title: "AI agent support",
    date: "18 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            [Dev preview] NTUMods now offers its tools to AI agents through
            WebMCP, a new browser standard that is still in early testing and
            depends mostly on the Chrome team. In a supporting browser, an
            assistant can search modules, check which indexes fit your plan,
            generate timetables and plan your CGPA, all on your own saved plans.
            Nothing is sent to our servers. Most students will not see a change
            yet. Guide:{" "}
            <ChangelogLink href="/articles/ntu-ai-agents-webmcp-guide">
              Plan your NTU timetable with an AI assistant
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            A public{" "}
            <ChangelogLink href="/.well-known/ai-catalog.json">
              AI catalog
            </ChangelogLink>{" "}
            and a{" "}
            <ChangelogLink href="/api/modules/SC1003">module API</ChangelogLink>{" "}
            help assistants that cannot run the site find the{" "}
            <ChangelogLink href="/llms.txt">llms.txt</ChangelogLink> summary and
            the open module, index and exam data.
          </>
        )
      }
    ]
  },
  {
    title: "Privacy policy updated",
    date: "17 Oct 2026",
    items: [
      {
        category: "Content",
        content: (
          <>
            The <ChangelogLink href="/privacy">privacy policy</ChangelogLink>{" "}
            now matches how the site works today: feedback is emailed to us
            rather than stored in a database, and the site is hosted on
            Cloudflare.
          </>
        )
      }
    ]
  },
  {
    title: "Landing page redesign",
    date: "17 Oct 2026",
    items: [
      {
        category: "Improvement",
        content: (
          <>
            A new design for the{" "}
            <ChangelogLink href="/">home page</ChangelogLink>! See example
            timetables for different courses, check this semester at a glance
            and find features and guides faster.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Several other pages have been updated with the new design:{" "}
            <ChangelogLink href="/faq">FAQ</ChangelogLink>,{" "}
            <ChangelogLink href="/feedback">feedback</ChangelogLink>,{" "}
            <ChangelogLink href="/changelog">changelog</ChangelogLink>,{" "}
            <ChangelogLink href="/links">links</ChangelogLink>,{" "}
            <ChangelogLink href="/sitemap">sitemap</ChangelogLink>,{" "}
            <ChangelogLink href="/privacy">privacy</ChangelogLink> and{" "}
            <ChangelogLink href="/articles">articles</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "AY 2026 Semester 2 now available",
    date: "15 Oct 2026",
    items: [
      {
        category: "Data",
        content: (
          <>
            AY 2026 Semester 2 course data is now live: 1,092 courses and 4,306
            indexes available in the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> and{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink>. See{" "}
            <ChangelogLink href="/articles/ntu-ay2026-semester-2-whats-new">
              what is new in Semester 2
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "Calendar export now uses the Semester 2 start date (11 January 2027) and recess week."
      },
      {
        category: "Content",
        content: (
          <>
            Updated the{" "}
            <ChangelogLink href="/articles/ntu-course-catalogue">
              NTU course catalogue
            </ChangelogLink>{" "}
            with Semester 2 module counts. The exam schedule still shows
            Semester 1 until NTU releases the Semester 2 timetable.
          </>
        )
      }
    ]
  },
  {
    title: "CGPA Planner",
    date: "8 Oct 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            <ChangelogLink href="/tools/cgpa-planner">
              CGPA Planner
            </ChangelogLink>
            : enter your CGPA and remaining AU, or upload your transcript, to
            see the average grade you need for Merit, Distinction or Highest
            Distinction. Your transcript is read in your browser and never
            uploaded. Guide:{" "}
            <ChangelogLink href="/articles/ntu-honours-classification-cgpa-guide">
              NTU honours and CGPA guide
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            Two new step-by-step guides with screenshots:{" "}
            <ChangelogLink href="/articles/ntu-cgpa-planner-guide">
              How to use the CGPA Planner
            </ChangelogLink>{" "}
            and{" "}
            <ChangelogLink href="/articles/ntu-fgo-optimiser-guide">
              How to use the FGO Optimiser
            </ChangelogLink>
            .
          </>
        )
      }
    ]
  },
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
            <ChangelogLink href="/timetable">Settings</ChangelogLink> — which
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
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
              Astro
            </a>{" "}
            and now hosted on{" "}
            <a
              href="https://www.cloudflare.com/"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
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
            <ChangelogLink href="/feedback">feedback submissions</ChangelogLink>{" "}
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
