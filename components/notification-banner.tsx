import Link from "next/link"

interface SkeletonProps {
  children: React.ReactNode
}

function Banner(props: SkeletonProps) {
  return (
    <div className="relative z-10 flex items-center justify-center bg-primary p-1 dark:bg-muted">
      <p className="text-center text-sm leading-6 text-white">
        {props.children}
      </p>
    </div>
  )
}

export const NotificationBanner = {
  inAlpha: () => (
    <Link href="/debug">
      <Banner>
        <strong>ALPHA BUILD</strong> - Click here if you get stuck!
      </Banner>
    </Link>
  ),
  inBeta: () => (
    <Banner>
      NTU Mods is in <strong className="font-semibold">Beta!</strong> Let us
      know if you have any suggestions or problems.
    </Banner>
  ),
  optimisedForWeb: () => (
    <Banner>Optimsed for website, mobile support coming soon!</Banner>
  ),
  experienceProblems: () => (
    <Banner>
      Clicking of courses in the timetable has problems, please use the
      &quot;Add Mods&quot; button for now
    </Banner>
  )
}
