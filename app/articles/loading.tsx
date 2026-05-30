export default function Loading() {
  return (
    <div className="min-w-0 animate-pulse py-4 sm:py-6">
      <div className="h-4 w-32 rounded-md bg-muted" />
      <div className="mt-5 space-y-4">
        <div className="h-10 w-3/4 rounded-md bg-muted" />
        <div className="h-4 w-full rounded-md bg-muted" />
        <div className="h-4 w-5/6 rounded-md bg-muted" />
        <div className="h-4 w-4/6 rounded-md bg-muted" />
      </div>
    </div>
  )
}
