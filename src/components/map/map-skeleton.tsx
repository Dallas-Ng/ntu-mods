import { Skeleton } from "@/components/ui/skeleton"

/**
 * The map's layout drawn in grey, so the page looks right from the first paint
 * (it is in the prerendered HTML) and nothing jumps when the data arrives.
 * Positions mirror the real search pill, chips, side sheet and controls.
 */
const MapSkeleton = () => (
  <div
    className="absolute inset-0"
    role="status"
    aria-busy="true"
    aria-label="Loading the campus map">
    <div className="bg-muted/50 absolute inset-0" />

    {/* Search pill and category chips */}
    <Skeleton className="bg-accent/80 absolute top-3 right-3 left-3 h-11 rounded-full lg:right-auto lg:w-[360px]" />
    <div className="absolute top-[64px] right-3 left-3 flex gap-2 overflow-hidden lg:top-3 lg:right-28 lg:left-[384px]">
      {[132, 76, 76, 112, 104, 92, 80].map((w, i) => (
        <Skeleton
          key={i}
          style={{ width: w }}
          className="bg-accent/80 h-9 shrink-0 rounded-full lg:mt-1"
        />
      ))}
    </div>

    {/* Side sheet (desktop) */}
    <div className="bg-card/95 absolute top-[68px] left-3 hidden w-[360px] space-y-4 rounded-2xl border p-4 lg:block">
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[56, 48, 52, 64, 50, 54, 46, 44].map((w, i) => (
          <Skeleton key={i} style={{ width: w }} className="h-7 rounded-full" />
        ))}
      </div>
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-11 items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
    </div>

    {/* Bottom sheet (phones) */}
    <div className="bg-card absolute inset-x-0 bottom-0 h-[46%] space-y-3 rounded-t-2xl border-t p-4 lg:hidden">
      <Skeleton className="mx-auto h-1 w-10 rounded-full" />
      <Skeleton className="h-5 w-3/5" />
      <div className="flex flex-wrap gap-1.5">
        {[56, 48, 52, 64].map((w, i) => (
          <Skeleton key={i} style={{ width: w }} className="h-7 rounded-full" />
        ))}
      </div>
    </div>

    {/* Map and level buttons, zoom controls */}
    <div className="absolute top-3 right-3 hidden flex-col items-end gap-2 lg:flex">
      <Skeleton className="bg-accent/80 h-11 w-[84px] rounded-xl" />
      <Skeleton className="bg-accent/80 h-11 w-[84px] rounded-xl" />
    </div>
    <Skeleton className="bg-accent/80 absolute right-3 bottom-3 hidden h-[84px] w-10 rounded-xl lg:block" />
  </div>
)

export default MapSkeleton
