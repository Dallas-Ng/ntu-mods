import Link from "next/link"

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
        "relative z-10 flex items-center justify-center bg-yellow-400 p-1",
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
    <Link href="/debug">
      <BannerWrapper>
        <strong>ALPHA BUILD</strong> - Click here if you get stuck!
      </BannerWrapper>
    </Link>
  ),
  optimisedForWeb: () => (
    <BannerWrapper>
      Optimsed for website, mobile support coming soon!
    </BannerWrapper>
  ),
  updatedAy: () => (
    <Link href="/changelog">
      <BannerWrapper>NTU Mods has new features!</BannerWrapper>
    </Link>
  ),
  bdeGuides: () => (
    <Link href="/articles">
      <BannerWrapper>
        New guides: BDE planning, easy BDEs, language BDEs and more →
      </BannerWrapper>
    </Link>
  ),
  ay2026s1: () => (
    <Link href="/changelog">
      <BannerWrapper>
        New: exam schedule, bulk module import, index locking, prereq graphs,
        and more →
      </BannerWrapper>
    </Link>
  ),
  experienceProblems: () => (
    <BannerWrapper>
      Clicking of courses in the timetable has problems, please use the
      &quot;Add Mods&quot; button for now
    </BannerWrapper>
  )
}
