import { Skeleton } from "@/components/ui/skeleton"

/**
 * The map's layout drawn in grey, so the page looks right from the first paint
 * (it is in the prerendered HTML) and nothing jumps when the data arrives.
 * Sizes and positions are measured from the real controls (search pill, chips,
 * home sheet, Map/Level buttons, zoom stack), so keep them in step with those.
 */
const CHIPS = [160, 83, 83, 141, 139, 115, 94, 121, 94, 163]
const BUSY = [75, 57, 60, 66, 56, 50, 85, 48]

const FLOAT = "bg-accent/80"

/** A text line: a box as tall as the real line, a bar a little shorter inside. */
const Line = ({ h, w }: { h: number; w: number | string }) => (
  <div className="flex items-center" style={{ height: h }}>
    <Skeleton className="h-[70%]" style={{ width: w }} />
  </div>
)

/** The home panel: heading, busy rooms, browse by type. */
const HomeContent = () => (
  <div className="space-y-5">
    <div>
      <Line h={23} w={240} />
      <div className="mt-1">
        <Line h={20} w="85%" />
      </div>
    </div>
    <section className="space-y-2">
      <Line h={20} w={150} />
      <div className="flex flex-wrap gap-1.5">
        {BUSY.map((w, i) => (
          <Skeleton
            key={i}
            style={{ width: w }}
            className="h-[30px] rounded-full"
          />
        ))}
      </div>
    </section>
    <section className="space-y-2">
      <Line h={20} w={110} />
      <ul className="-mx-2 space-y-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i} className="flex h-11 items-center gap-3 px-2">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-3 w-5" />
          </li>
        ))}
      </ul>
    </section>
  </div>
)

const MapSkeleton = () => (
  <div
    className="absolute inset-0"
    role="status"
    aria-busy="true"
    aria-label="Loading the campus map">
    <div className="bg-muted/50 absolute inset-0" />

    {/* Search pill, scroll arrows and category chips */}
    <Skeleton
      className={`${FLOAT} absolute top-3 right-3 left-3 h-[46px] rounded-full lg:right-auto lg:w-[360px]`}
    />
    <Skeleton
      className={`${FLOAT} absolute top-[70px] left-3 size-8 rounded-full lg:top-[18px] lg:left-[384px]`}
    />
    <Skeleton
      className={`${FLOAT} absolute top-[70px] right-3 size-8 rounded-full lg:top-[18px] lg:right-[104px]`}
    />
    <div className="absolute top-[68px] right-[53px] left-[52px] flex gap-2 overflow-hidden lg:top-4 lg:right-[145px] lg:left-[424px]">
      {CHIPS.map((w, i) => (
        <Skeleton
          key={i}
          style={{ width: w }}
          className={`${FLOAT} h-9 shrink-0 rounded-full`}
        />
      ))}
    </div>

    {/* Side sheet (desktop) */}
    <div className="bg-card absolute top-[68px] left-3 hidden w-[360px] rounded-2xl border p-4 lg:block">
      <HomeContent />
    </div>

    {/* Bottom sheet (phones), cut off by the frame like the real one */}
    <div className="bg-card absolute inset-x-0 bottom-0 h-[46.4%] overflow-hidden rounded-t-2xl border-t p-4 lg:hidden">
      <Skeleton className="mx-auto mb-3 h-1 w-10 rounded-full" />
      <HomeContent />
    </div>

    {/* Map and Level buttons */}
    <div className="absolute top-[120px] right-3 flex flex-col items-end gap-2 lg:top-3">
      <Skeleton className={`${FLOAT} h-11 w-[84px] rounded-xl`} />
      <Skeleton className={`${FLOAT} h-11 w-[84px] rounded-xl`} />
    </div>

    {/* Zoom stack and frame button; above the bottom sheet on phones */}
    <div className="absolute right-3 bottom-[calc(46.4%+12px)] flex flex-col gap-2 lg:bottom-3">
      <Skeleton className={`${FLOAT} h-[83px] w-[42px] rounded-xl`} />
      <Skeleton className={`${FLOAT} size-[42px] rounded-xl`} />
    </div>
  </div>
)

export default MapSkeleton
