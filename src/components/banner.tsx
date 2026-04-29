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
          "text-center text-sm font-medium leading-6 text-black",
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
  inBeta: () => (
    <BannerWrapper>
      NTU Mods is in <strong className="font-semibold">Beta!</strong> Let us
      know if you have any suggestions or problems.
    </BannerWrapper>
  ),
  release: () => (
    <Link href="/mods">
      <BannerWrapper>
        NTU Mods is out of Beta! Click here to visit Mods
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
  experienceProblems: () => (
    <BannerWrapper>
      Clicking of courses in the timetable has problems, please use the
      &quot;Add Mods&quot; button for now
    </BannerWrapper>
  )
}
