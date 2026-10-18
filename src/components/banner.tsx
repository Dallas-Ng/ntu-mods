import { cn } from "@/lib/utils"

interface BannerProps {
  children: React.ReactNode
  divClass?: string
  pClass?: string
}

// Keep a trailing arrow on the same line as the word before it, so a narrow
// screen never leaves "→" alone on a second line.
const glueArrow = (node: React.ReactNode) =>
  typeof node === "string" ? node.replace(/\s+→$/, "\u00A0→") : node

export const BannerWrapper = (props: BannerProps) => {
  return (
    <div
      data-nosnippet
      className={cn(
        "relative z-10 flex items-center justify-center bg-sky-300 px-2 py-1.5 md:p-1",
        props.divClass
      )}>
      <p
        className={cn(
          "text-center text-sm leading-[1.2] font-medium text-balance text-black md:leading-5",
          props.pClass
        )}>
        {glueArrow(props.children)}
      </p>
    </div>
  )
}

export const Banner = {
  inAlpha: () => (
    <a href="/debug">
      <BannerWrapper>
        <strong>ALPHA BUILD</strong> - Click here if you get stuck!
      </BannerWrapper>
    </a>
  ),
  optimisedForWeb: () => (
    <BannerWrapper>
      Optimsed for website, mobile support coming soon!
    </BannerWrapper>
  ),
  tools: () => (
    <a href="/tools">
      <BannerWrapper>
        New: CGPA Planner and FGO Optimiser in the Tools section →
      </BannerWrapper>
    </a>
  ),
  updatedAy: () => (
    <a href="/changelog">
      <BannerWrapper>NTU Mods has new features!</BannerWrapper>
    </a>
  ),
  bdeGuides: () => (
    <a href="/articles">
      <BannerWrapper>
        New guides: BDE planning, easy BDEs, language BDEs and more →
      </BannerWrapper>
    </a>
  ),
  ay2026s1: () => (
    <a href="/changelog">
      <BannerWrapper>
        New: filter modules by day and time, student links, custom courses →
      </BannerWrapper>
    </a>
  ),
  aiAgents: () => (
    <a href="/articles/ntu-ai-agents-webmcp-guide">
      <BannerWrapper>
        New: AI agents can now search modules and build timetables on NTUMods →
      </BannerWrapper>
    </a>
  ),
  ay2026s2: () => (
    <a href="/articles/ntu-ay2026-semester-2-whats-new">
      <BannerWrapper divClass="bg-yellow-300">
        AY2026/27 Semester 2 modules are now live: see what&apos;s new →
      </BannerWrapper>
    </a>
  ),
  performanceUpdate: () => (
    <a href="/changelog">
      <BannerWrapper divClass="bg-yellow-300">
        We&apos;ve improved performance — pages load faster than before →
      </BannerWrapper>
    </a>
  ),
  timetableNotes: () => (
    <a href="/changelog">
      <BannerWrapper>
        New: standardised scale and notes on your modules →
      </BannerWrapper>
    </a>
  ),
  mobileTimetableRebuilt: () => (
    <a href="/changelog">
      <BannerWrapper divClass="bg-yellow-300">
        New: mobile timetable rebuilt — faster, more reliable, easier to use →
      </BannerWrapper>
    </a>
  ),
  dataUpdated: () => (
    <BannerWrapper>
      Exam timetable data last updated 15 September 2026
    </BannerWrapper>
  ),
  experienceProblems: () => (
    <BannerWrapper>
      Clicking of courses in the timetable has problems, please use the
      &quot;Add Mods&quot; button for now
    </BannerWrapper>
  )
}
