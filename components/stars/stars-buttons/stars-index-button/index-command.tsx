import { Fragment } from "react"
import { useBoundState } from "@/state/bound-state"
import { Check } from "lucide-react"

import { DAY_MAP } from "@/config/stars"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"

interface Props {
  filteredIndexes: CourseIndex
  handleSearch: (searchTerm: string) => void
  handleSelect: (idxKey: string) => void
  commandClassName?: React.HtmlHTMLAttributes<HTMLDivElement>["className"]
  coursesToIndex?: { [courseKey: string]: Index[] }
}

export default function IndexCommand(props: Props) {
  const { handleSearch, filteredIndexes, handleSelect, commandClassName } =
    props

  const state = useBoundState()
  let coursesToIndex = props.coursesToIndex ?? state.coursesToIndex

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search index, timing or tutorial group"
        onValueChange={handleSearch}
      />

      <CommandEmpty>No indexes code found</CommandEmpty>

      {Object.keys(filteredIndexes).length > 0 && (
        <div className="sticky top-0 z-20 flex w-full items-center gap-2 bg-background p-1 text-xs">
          <div className="flex gap-1">
            <span className="w-4" />
            <span className="w-[43px] text-center">Code</span>
          </div>

          <span className="w-full">Day / Time</span>
          <span className="whitespace-nowrap text-end">Group / Venue</span>
        </div>
      )}

      <CommandGroup className={commandClassName}>
        {Object.entries(filteredIndexes).map(([idxKey, fiValue], idx) => {
          const active = Object.values(coursesToIndex).find(
            (v) => v[0].key === idxKey
          )

          return (
            <Fragment key={idxKey}>
              {idx !== 0 && <hr className="my-1" />}

              <CommandItem
                value={idxKey}
                onSelect={handleSelect}
                className={cn("mb-1 cursor-pointer p-1", active && "bg-muted")}>
                <div className="flex w-full justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <Check
                      className={cn(
                        "inline h-4 w-4",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />

                    {idxKey}
                  </span>

                  {/* Dont remove this flex-col, there can be multiple timeslots for 1 index (e.g. lab, tutorial, lecture) */}
                  <div className="flex w-full flex-col gap-1">
                    {fiValue.map((v, i) => (
                      <div key={i}>
                        <div className="flex w-full justify-between gap-2">
                          <span>{DAY_MAP[v.day]}</span>

                          <span>
                            {v.type} - {v.group}
                          </span>
                        </div>

                        <div className="flex w-full justify-between gap-2">
                          <span>{v.time}</span>
                          <span>{v.venue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CommandItem>
            </Fragment>
          )
        })}
      </CommandGroup>
    </Command>
  )
}
