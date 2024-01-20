import Link from "next/link"

interface BannerProps {
  children: React.ReactNode
}

const BannerWrapper = (props: BannerProps) => {
  return (
    <div className="relative z-10 flex items-center justify-center bg-primary p-1">
      <p className="text-center text-sm font-medium leading-6 text-primary-foreground">
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
  experienceProblems: () => (
    <BannerWrapper>
      Clicking of courses in the timetable has problems, please use the
      &quot;Add Mods&quot; button for now
    </BannerWrapper>
  )
}
