"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { M_DATA } from "@/data/2023/m-data"
import { M_DATA_S1 } from "@/data/2023/m-data-s1"
import { M_DATA_S2 } from "@/data/2023/m-data-s2"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"
import { RefreshCcw } from "lucide-react"

import { MODULE_CATEGORY, MODULE_FACULTY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import ButtonCollapsable from "@/components/button-collapsable"

type Semester = "s1" | "s2" | "all"
type SearchModuleType = ModuleType | "all"
type SearchModuleFaculty = ModuleFaculty | "all"

export default function ModsPage() {
  const [search, setSearch] = useState("")
  const [semester, setSemester] = useState<Semester>("s2")
  const [moduleType, setModuleType] = useState<SearchModuleType>("all")
  const [moduleFaculty, setModuleFaculty] = useState<SearchModuleFaculty>("all")
  const [filteredModules, setFilteredModules] = useState<[string, Module][]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [openFacultyPopover, setOpenFacultyPopover] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dbSearchTerm = useDebounce(search, 200) // arbitrary delay - anything lower makes it feel laggy

  const dontShowCondition =
    moduleType === "all" && moduleFaculty === "all" && dbSearchTerm.length === 0

  /**
   * Upon page load or when the search params change, update the search state
   */
  useEffect(() => {
    const query = searchParams.toString()
    const params = new URLSearchParams(query)

    setSearch(params.get("dbSearchTerm") || "")
    setSemester((params.get("semester") as Semester) || "s2")
    setModuleType((params.get("moduleType") as SearchModuleType) || "all")
    setModuleFaculty(
      (params.get("moduleFaculty") as SearchModuleFaculty) || "all"
    )
  }, [searchParams])

  /**
   * Update filters
   */
  useEffect(() => {
    if (dontShowCondition) {
      return setFilteredModules([])
    }

    const MODULE_DATA =
      semester === "all" ? M_DATA : semester === "s2" ? M_DATA_S2 : M_DATA_S1

    let filteredModules = Object.entries(MODULE_DATA)

    // Assume its a module code prefix
    if (dbSearchTerm.length === 2) {
      filteredModules = filteredModules.filter(([moduleKey, _]) => {
        return moduleKey.toLowerCase().startsWith(dbSearchTerm.toLowerCase())
      })
    }

    // Filter by module type
    filteredModules = filteredModules.filter(([_, moduleData]) => {
      if (moduleType === "all") return true
      return getModuleCategories(moduleData.searchKeys).includes(moduleType)
    })

    // Filter by module faculty
    filteredModules = filteredModules.filter(([_, moduleData]) => {
      if (moduleFaculty === "all") return true

      return getModuleFaculty(moduleData.searchKeys) === moduleFaculty
    })

    // Filter by module name or tilte
    filteredModules = filteredModules.filter(([moduleKey, moduleData]) => {
      return (
        moduleKey.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
        moduleData.title.toLowerCase().includes(dbSearchTerm.toLowerCase())
      )
    })

    filteredModules.sort(([a], [b]) => a.localeCompare(b))

    setFilteredModules(filteredModules)

    const filters = { dbSearchTerm, semester, moduleType, moduleFaculty }
    const query = new URLSearchParams(filters)
    router.push(pathname + "?" + query.toString())
  }, [dbSearchTerm, semester, moduleType, moduleFaculty])

  /**
   *
   */
  const resetFilters = () => {
    setSearch("")
    setSemester("s2")
    setModuleType("all")
    setModuleFaculty("all")
    router.push(pathname)
  }

  return (
    <div className="relative space-y-3">
      <h1 className="text-3xl font-semibold capitalize">NTU Modules</h1>

      {filteredModules.length === 0 ? (
        <p className="text-muted-foreground">
          View all {Object.keys(M_DATA).length} modules offered by NTU in
          AY2023/2024.
        </p>
      ) : (
        <p className="text-muted-foreground">
          Filtered down to {filteredModules.length} modules.
        </p>
      )}
      <div
        className="flex w-full flex-col gap-2 md:flex-row"
        onClick={(e) => e.stopPropagation()}>
        <Input
          className="md:flex-1"
          name="moduleCode"
          placeholder="Search for module name or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div ref={containerRef} className="md:w-[200px] lg:w-[350px]">
          <Popover
            open={openFacultyPopover}
            onOpenChange={setOpenFacultyPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between md:w-[200px] lg:w-[350px]">
                {moduleFaculty === "all"
                  ? "All Faculty"
                  : MODULE_FACULTY[moduleFaculty]}
                <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              onOpenAutoFocus={(e) => e.preventDefault()}
              className="p-0"
              container={containerRef.current}
              style={{
                width: containerRef.current?.clientWidth
                  ? containerRef.current.clientWidth + 4 // border width
                  : "auto"
              }}>
              <Command>
                <CommandInput placeholder="Search faculty..." />

                <CommandEmpty>No faculty found.</CommandEmpty>

                <CommandGroup className="max-h-96 overflow-y-auto">
                  <CommandItem
                    className="cursor-pointer hover:bg-accent"
                    onSelect={() => {
                      setModuleFaculty("all")
                      setOpenFacultyPopover(false)
                    }}>
                    <div className="flex items-baseline gap-2">
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          moduleFaculty === "all" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-baseline gap-2">
                        All Faculty
                      </div>
                    </div>
                  </CommandItem>

                  {Object.entries(MODULE_FACULTY).map(
                    ([facultyKey, facultyName]) => (
                      <CommandItem
                        key={facultyKey}
                        value={facultyKey}
                        className="cursor-pointer md:hover:bg-accent"
                        onSelect={() => {
                          setModuleFaculty(facultyKey as ModuleFaculty)
                          setOpenFacultyPopover(false)
                        }}>
                        <div className="flex items-baseline gap-2">
                          <CheckIcon
                            className={cn(
                              "ml-auto size-4",
                              moduleFaculty === facultyKey
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex items-baseline gap-2">
                            {facultyName}{" "}
                            <span className="text-xs text-muted-foreground">
                              {facultyKey}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    )
                  )}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Select
            defaultValue="all"
            value={moduleType}
            onValueChange={(val: ModuleType) => setModuleType(val)}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Module Type" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem key="all" value="all">
                All Module Types
              </SelectItem>

              {Object.entries(MODULE_CATEGORY).map(
                ([categoryKey, categoryName]) => {
                  return (
                    <Fragment key={categoryKey}>
                      {categoryKey === "USP" ? (
                        <></>
                      ) : (
                        <SelectItem key={categoryKey} value={categoryKey}>
                          {categoryName}
                        </SelectItem>
                      )}
                    </Fragment>
                  )
                }
              )}
            </SelectContent>
          </Select>

          <Select
            defaultValue="all"
            value={semester}
            onValueChange={(val: Semester) => setSemester(val)}>
            <SelectTrigger className="md:w-[100px] lg:w-[180px]">
              <SelectValue placeholder="All Semester" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="s1">Sem 1</SelectItem>
              <SelectItem value="s2">Sem 2</SelectItem>
            </SelectContent>
          </Select>

          <div className="md:flex-1">
            <ButtonCollapsable
              icon={RefreshCcw}
              text="Reset"
              onClick={resetFilters}
            />
          </div>
        </div>
      </div>

      <hr className="py-2" />

      {!dontShowCondition && filteredModules.length === 0 && (
        <div className="flex h-20 w-full items-center rounded-md border text-center">
          <p className="w-full text-center">
            There are no modules found
            <br />
            <span className="text-muted-foreground">
              Try changing your filters
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {filteredModules.map(([code, moduleData]) => (
          <Link key={code} href={`/mods/${code}`}>
            <div className="rounded-lg border-2 p-3 transition-colors hover:bg-accent">
              <p className="text-sm text-muted-foreground">{moduleData.code}</p>

              <p className="truncate">{moduleData.title}</p>

              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex gap-1 text-muted-foreground">
                  {getModuleCategories(moduleData.searchKeys).map(
                    (category, i) => (
                      <div key={i} className="rounded-full border px-2 py-0">
                        <span key={i}>{MODULE_CATEGORY[category]}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {getModuleFaculty(moduleData.searchKeys)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground transition-colors hover:text-primary-alt">
        <Link
          href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
          target="_blank">
          Updated as at AY2023/2024
        </Link>
      </p>
    </div>
  )
}
