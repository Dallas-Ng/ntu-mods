interface SkeletonProps {
  children: React.ReactNode
}

function Skeleton(props: SkeletonProps) {
  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-1 z-50 relative">
      <p className="text-sm leading-6 text-slate-950 dark:text-white text-center">
        {props.children}
      </p>
    </div>
  )
}

export const NotificationBanner = {
  reportBugs: () => (
    <Skeleton>Let us know if you encounter bugs or have suggestions.</Skeleton>
  ),
  inBeta: () => (
    <Skeleton>
      We are in <strong className="font-semibold">Beta!</strong> Let us know if
      you encounter bugs or have suggestions.
    </Skeleton>
  )
}
