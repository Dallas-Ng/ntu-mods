import { cn } from "@/lib/utils"

interface BannerProps {
  children: React.ReactNode
  divClass?: string
  pClass?: string
}

export const BannerWrapper = (props: BannerProps) => {
  return (
    <div
      className={cn(
        "relative z-10 flex items-center justify-center bg-sky-300 p-1",
        props.divClass
      )}>
      <p
        className={cn(
          "text-center text-sm leading-6 font-medium text-black",
          props.pClass
        )}>
        {props.children}
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
  experienceProblems: () => (
    <BannerWrapper>
      Clicking of courses in the timetable has problems, please use the
      &quot;Add Mods&quot; button for now
    </BannerWrapper>
  )
}
