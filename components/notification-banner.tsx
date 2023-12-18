interface SkeletonProps {
  children: React.ReactNode
}

function Banner(props: SkeletonProps) {
  return (
    <div className="relative z-50 flex items-center justify-center bg-gray-100 p-1 dark:bg-slate-900">
      <p className="text-center text-sm leading-6 text-slate-950 dark:text-white">
        {props.children}
      </p>
    </div>
  )
}

export const NotificationBanner = {
  inAlpha: () => (
    <Banner>
      <strong>ALPHA BUILD</strong> - Let us know if you encounter bugs or have
      suggestions.
    </Banner>
  ),
  inBeta: () => (
    <Banner>
      We are in <strong className="font-semibold">Beta!</strong> Let us know if
      you encounter bugs or have suggestions.
    </Banner>
  )
}
