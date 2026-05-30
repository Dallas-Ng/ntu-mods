export default function Loading() {
  return (
    <div className="animate-pulse py-4 sm:py-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="w-full space-y-3 xl:w-3/6">
          <div className="bg-muted h-4 w-20 rounded-md" />
          <div className="bg-muted h-8 w-2/3 rounded-md" />
          <div className="bg-muted h-4 w-full rounded-md" />
          <div className="bg-muted h-4 w-5/6 rounded-md" />
        </div>
        <div className="bg-muted h-32 w-full rounded-md xl:w-3/6" />
      </div>
      <div className="mt-10 space-y-3">
        <div className="bg-muted h-6 w-40 rounded-md" />
        <div className="bg-muted h-48 w-full rounded-md" />
      </div>
    </div>
  )
}
