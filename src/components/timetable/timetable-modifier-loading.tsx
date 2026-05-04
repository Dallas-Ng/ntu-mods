import { Skeleton } from "../ui/skeleton"

export const TimetableModifierLoader = () => (
  <div className="space-y-4 opacity-30">
    <Skeleton className="h-[40px]" />

    <div className="relative max-h-[50vh] min-h-10 w-full overflow-y-auto rounded-lg border-2">
      <div className="text-muted-foreground p-2 text-center text-xs">
        Registered Modules
      </div>

      <hr />

      <div className="p-2">
        <div className="text-muted-foreground text-center text-sm">
          You have not added modules
          <br /> Click on the search bar above to add modules
        </div>
      </div>
    </div>
  </div>
)
