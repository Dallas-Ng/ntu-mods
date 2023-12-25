import { useBoundState } from "@/state/bound-state"
import { Check } from "lucide-react"

import { DAY_MAPPING, cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator
} from "@/components/ui/command"

interface Props {
  filteredIndexes: CourseIndex
  handleSearch: (searchTerm: string) => void
  handleSelect: (idxKey: string) => void
  commandClassName?: React.HtmlHTMLAttributes<HTMLDivElement>["className"]
}

export default function IndexCommand(props: Props) {
  const { coursesToIndex } = useBoundState()
  const { handleSearch, filteredIndexes, handleSelect, commandClassName } =
    props

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search index, preferred timing or tutorial group"
        onValueChange={handleSearch}
      />

      <CommandEmpty>No indexes code found</CommandEmpty>

      <CommandGroup className={cn("relative p-0 px-1", commandClassName)}>
        {Object.keys(filteredIndexes).length > 0 && (
          <div className="sticky top-[0px] z-[20] flex w-full items-center bg-popover pb-1 text-xs">
            <span className="w-[200px] text-center">Code</span>

            <span className="w-full">Day / Time</span>
            <span className="whitespace-nowrap text-end">Group / Venue</span>
          </div>
        )}

        {Object.entries(filteredIndexes).map(([idxKey, fiValue], idx) => (
          <>
            {idx !== 0 && <CommandSeparator className="mx-2 my-1" />}

            <CommandItem
              key={idxKey}
              value={idxKey}
              onSelect={handleSelect}
              className="mb-1 cursor-pointer">
              <div className="flex w-full justify-between gap-6">
                <span className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 inline h-4 w-4",
                      Object.values(coursesToIndex).find(
                        (v) => v[0].key === idxKey
                      )
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {idxKey}
                </span>

                {/* Dont remove this flex-col, there can be multiple timeslots for 1 index (e.g. lab, tutorial, lecture) */}
                <div className="flex w-full flex-col gap-1">
                  {fiValue.map((v, i) => (
                    <div key={i}>
                      <div className="flex w-full justify-between gap-2">
                        <span>
                          {DAY_MAPPING[v.day as keyof typeof DAY_MAPPING]}
                        </span>

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
          </>
        ))}
      </CommandGroup>
    </Command>
  )
}
