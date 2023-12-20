import Link from "next/link"

interface SkeletonProps {
  children: React.ReactNode
}

function Banner(props: SkeletonProps) {
  return (
    <div className="relative z-10 flex items-center justify-center bg-gray-100 p-1 dark:bg-slate-900">
      <p className="text-center text-sm leading-6 text-slate-950 dark:text-white">
        {props.children}
      </p>
    </div>
  )
}

export const NotificationBanner = {
  inAlpha: () => (
    <Link href="/debug">
      <Banner>
        <strong>ALPHA BUILD</strong> - Click here if you get stuck! <br />
        Optimsed for website, mobile support coming soon!
      </Banner>
    </Link>
  ),
  inBeta: () => (
    <Banner>
      We are in <strong className="font-semibold">Beta!</strong> Let us know if
      you encounter bugs or have suggestions.
    </Banner>
  ),
  optimisedForWeb: () => (
    <Banner>Optimsed for website, mobile support coming soon!</Banner>
  )
}
