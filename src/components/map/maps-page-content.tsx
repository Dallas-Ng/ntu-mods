"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Navigation,
  Search,
  Share2,
  X
} from "lucide-react"
import { toast } from "sonner"

import { searchPlaces } from "@/lib/place-search"
import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  CATEGORY_ALIASES,
  estimateWalk,
  fetchWalk,
  HYBRID_TONES,
  levelLabel,
  levelShort,
  loadVenueData,
  project,
  type HybridTone,
  type LandmarkCat,
  type VenueData,
  type WalkResult
} from "@/lib/venue-map"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import Header from "@/components/header"
import CampusMap, {
  FLOATING,
  type Focus,
  type Highlight,
  type Marker,
  type Pin,
  type RouteLayer
} from "@/components/map/campus-map"
import { PlaceIcon } from "@/components/map/category-icons"
import MapOptions, { type MapStyle } from "@/components/map/map-options"
import PlacePicker, {
  buildPlaces,
  type PickerPlace
} from "@/components/map/place-picker"

const PREFS_KEY = "ntumods-map-prefs"

/** Lecture theatres are not a MazeMap category, so recognise them by name. */
const isLectureTheatre = (p: PickerPlace) =>
  p.kind === "venue" && /(^|-)LT\d*[A-Z]?$/.test(p.name)

const BROWSE: { key: string; label: string }[] = [
  { key: "lt", label: "Lecture theatres" },
  ...(
    [
      "hall",
      "food",
      "study",
      "transport",
      "parking",
      "sports",
      "exam",
      "toilet",
      "services"
    ] as const
  ).map((key) => ({ key, label: CATEGORIES[key].label }))
]

const placeIcon = (p: PickerPlace): string =>
  p.kind === "building"
    ? "building"
    : p.kind === "landmark"
      ? (p.cat ?? "venue")
      : isLectureTheatre(p)
        ? "lt"
        : "venue"

const polyMetres = (data: VenueData, pts: number[]) => {
  let m = 0
  for (let i = 2; i < pts.length; i += 2) {
    const [x0, y0] = project(data.origin, pts[i - 2], pts[i - 1])
    const [x1, y1] = project(data.origin, pts[i], pts[i + 1])
    m += Math.hypot(x1 - x0, y1 - y0)
  }
  return Math.round(m / 5) * 5
}

/** Share the current view: the phone's share sheet where there is one, else copy. */
const shareLink = async (title: string) => {
  const url = window.location.href
  if (
    typeof navigator.share === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  ) {
    try {
      await navigator.share({ title, url })
      return
    } catch (e) {
      if ((e as Error).name === "AbortError") return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success("Link copied")
  } catch {
    toast.error("Could not copy the link")
  }
}

/** Small round share button for panel headers. */
const HeaderShare = ({ title }: { title: string }) => (
  <button
    type="button"
    aria-label="Share this view"
    title="Share this view"
    onClick={() => shareLink(title)}
    className="hover:bg-accent flex size-8 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.92]">
    <Share2 className="size-4" />
  </button>
)

const sortPlaces = (rows: PickerPlace[]) =>
  rows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  )

// --- bottom sheet geometry (phones) ---
const PEEK = 148
const SHEET_FRACTION = 0.88
/** Apple's momentum projection: where a flick would come to rest. */
const project1d = (v: number, rate = 0.998) => ((v / 1000) * rate) / (1 - rate)

const MapsPageContent = () => {
  const desktop = useMediaQuery("(min-width: 1024px)")
  const [data, setData] = useState<VenueData | null>(null)
  useEffect(() => {
    loadVenueData().then(setData)
  }, [])
  const places = useMemo(() => (data ? buildPlaces(data) : []), [data])
  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places])

  // --- view preferences (what to label), remembered per browser ---
  const [cats, setCats] = useState<Set<LandmarkCat>>(
    () =>
      new Set(
        (Object.keys(CATEGORIES) as LandmarkCat[]).filter(
          (c) => CATEGORIES[c].defaultOn
        )
      )
  )
  const [buildingLabels, setBuildingLabels] = useState(true)
  const [roomLabels, setRoomLabels] = useState(true)
  const [mapStyle, setMapStyle] = useState<MapStyle>("standard")
  const [hybridTone, setHybridTone] = useState<HybridTone>("grey")
  // Saving waits for loading, or the defaults would overwrite what was stored.
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null")
      if (p) {
        setCats(new Set(p.cats))
        setBuildingLabels(p.buildingLabels)
        setRoomLabels(p.roomLabels)
        if (p.mapStyle === "satellite" || p.mapStyle === "hybrid")
          setMapStyle(p.mapStyle)
        if (HYBRID_TONES.some((t) => t.key === p.hybridTone))
          setHybridTone(p.hybridTone)
      }
    } catch {}
    setPrefsLoaded(true)
  }, [])
  useEffect(() => {
    if (!prefsLoaded) return
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          cats: [...cats],
          buildingLabels,
          roomLabels,
          mapStyle,
          hybridTone
        })
      )
    } catch {}
  }, [prefsLoaded, cats, buildingLabels, roomLabels, mapStyle, hybridTone])

  const resetSettings = () => {
    setCats(
      new Set(
        (Object.keys(CATEGORIES) as LandmarkCat[]).filter(
          (c) => CATEGORIES[c].defaultOn
        )
      )
    )
    setBuildingLabels(true)
    setRoomLabels(true)
    setMapStyle("standard")
    setHybridTone("grey")
  }

  // --- what the student is looking at ---
  const [directions, setDirections] = useState(false)
  const [level, setLevel] = useState<number | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [detent, setDetent] = useState(1)
  const [q, setQ] = useState("")
  const dq = useDebounce(q, 150)

  const selected = selectedId ? byId.get(selectedId) : undefined
  const from = fromId ? byId.get(fromId) : undefined
  const to = toId ? byId.get(toId) : undefined

  const flyTo = useCallback((p: PickerPlace) => {
    const pad = p.bounds ? 40 : 70
    const [x0, y0, x1, y1] = p.bounds ?? [p.x, p.y, p.x, p.y]
    setFocus({
      bounds: [x0 - pad, y0 - pad, x1 + pad, y1 + pad],
      nonce: Date.now()
    })
  }, [])

  const select = useCallback(
    (id: string) => {
      const p = byId.get(id)
      if (!p) return
      setSelectedId(id)
      setDirections(false)
      setDetent(1)
      setLevel(p.z === 0 ? null : p.z)
      flyTo(p)
    },
    [byId, flyTo]
  )

  const chooseCat = (key: string | null) => {
    setQ("")
    setActiveCat(key)
    setSelectedId(null)
    setDirections(false)
    setDetent(1)
    if (key) setLevel(null)
  }

  // First view: the part of campus where classes are, not the empty margins.
  useEffect(() => {
    if (!data) return
    const q = (a: number[], f: number) =>
      [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * f)]
    const v = Object.values(data.venues)
    const xs = v.map((p) => p.x)
    const ys = v.map((p) => p.y)
    setFocus({
      bounds: [q(xs, 0.04), q(ys, 0.04), q(xs, 0.96), q(ys, 0.96)],
      nonce: Date.now()
    })
  }, [data])

  // Open a shared link as it was: place or directions, category, level, map type.
  const [linked, setLinked] = useState(false)
  useEffect(() => {
    if (!data || linked) return
    setLinked(true)
    const q = new URLSearchParams(window.location.search)
    const f = q.get("from")
    const t = q.get("to")
    const pl = q.get("place")
    const cat = q.get("cat")
    const lv = q.get("level")
    const style = q.get("map")
    const tone = q.get("tone")
    if (style === "satellite" || style === "hybrid") setMapStyle(style)
    const toneOk = HYBRID_TONES.find((x) => x.key === tone)
    if (toneOk) setHybridTone(toneOk.key)
    if (cat && BROWSE.some((b) => b.key === cat)) setActiveCat(cat)
    if (f && t && byId.has(f) && byId.has(t)) {
      setFromId(f)
      setToId(t)
      setDirections(true)
      return
    }
    if (pl && byId.has(pl)) select(pl)
    // The level comes last so it wins over the place's own level.
    const z = lv === null ? NaN : Number(lv)
    if (data.levels.some((l) => l.z === z)) setLevel(z)
  }, [data, linked, byId, select])

  // Keep the address bar shareable: every view is a link.
  useEffect(() => {
    if (!linked) return
    const q = new URLSearchParams()
    if (directions && fromId && toId) {
      q.set("from", fromId)
      q.set("to", toId)
    } else {
      if (selectedId) q.set("place", selectedId)
      if (activeCat) q.set("cat", activeCat)
      if (level !== null) q.set("level", String(level))
    }
    if (mapStyle !== "standard") {
      q.set("map", mapStyle)
      if (mapStyle === "hybrid" && hybridTone !== "grey")
        q.set("tone", hybridTone)
    }
    const s = q.toString()
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${s ? `?${s}` : ""}`
    )
  }, [
    linked,
    directions,
    fromId,
    toId,
    selectedId,
    activeCat,
    level,
    mapStyle,
    hybridTone
  ])

  // --- directions ---
  const [solo, setSolo] = useState<{
    walk: WalkResult
    estimated: boolean
  } | null>(null)
  useEffect(() => {
    setSolo(null)
    if (!data || !from || !to || from.id === to.id) return
    let live = true
    fetchWalk(from, to).then((w) => {
      if (!live) return
      setSolo(
        w
          ? { walk: w, estimated: false }
          : { walk: estimateWalk(from, to), estimated: true }
      )
      setLevel(null)
      setFocus({
        bounds: [
          Math.min(from.x, to.x) - 30,
          Math.min(from.y, to.y) - 30,
          Math.max(from.x, to.x) + 30,
          Math.max(from.y, to.y) + 30
        ],
        nonce: Date.now()
      })
    })
    return () => {
      live = false
    }
  }, [data, from, to])

  const startDirections = (id?: string, as: "from" | "to" = "to") => {
    if (id) {
      if (as === "from") setFromId(id)
      else setToId(id)
    }
    setDirections(true)
    setDetent(1)
  }

  // --- what the map draws ---
  const pins: Pin[] = useMemo(() => {
    if (!directions) return []
    return [from && { p: from, n: "A" }, to && { p: to, n: "B" }].flatMap(
      (x) =>
        x
          ? [
              {
                id: x.p.id,
                x: x.p.x,
                y: x.p.y,
                z: x.p.z,
                label: x.p.name,
                numbers: [x.n as unknown as number],
                colour: "hsl(var(--primary))"
              }
            ]
          : []
    )
  }, [directions, from, to])

  const routes: RouteLayer[] = useMemo(
    () =>
      directions && solo
        ? [{ id: "solo", walk: solo.walk, status: "ok", active: true }]
        : [],
    [directions, solo]
  )

  const marker: Marker | null =
    !directions && selected
      ? {
          x: selected.x,
          y: selected.y,
          z: selected.z,
          label: selected.name,
          icon: placeIcon(selected),
          building: selected.kind === "building" ? selected.b : null,
          venue: selected.kind === "venue" ? selected.name : undefined
        }
      : null

  const catBase = useMemo(
    () =>
      !activeCat
        ? []
        : activeCat === "lt"
          ? places.filter(isLectureTheatre)
          : places.filter((p) => p.cat === activeCat),
    [places, activeCat]
  )
  // In a category, the search box filters that category.
  const catPlaces = useMemo(
    () =>
      dq.trim() ? searchPlaces(catBase, dq, 400) : sortPlaces([...catBase]),
    [catBase, dq]
  )
  const results = useMemo(
    () => (!activeCat && dq.trim() ? searchPlaces(places, dq, 30) : []),
    [places, dq, activeCat]
  )
  // "toilet", "food", "lt": offer the whole category before hundreds of rooms.
  const categoryHit = useMemo(() => {
    const t = dq.trim().toLowerCase()
    if (!t || activeCat || t.includes(" ")) return null
    for (const c of BROWSE) {
      const words =
        c.key === "lt"
          ? ["lt", "lecture", "theatre", "theatres"]
          : `${c.label} ${CATEGORY_ALIASES[c.key as LandmarkCat]}`
              .toLowerCase()
              .split(/\s+/)
      if (words.includes(t)) {
        const n =
          c.key === "lt"
            ? places.filter(isLectureTheatre).length
            : places.filter((p) => p.cat === c.key).length
        return n > 8 ? { key: c.key, label: c.label, count: n } : null
      }
    }
    return null
  }, [dq, activeCat, places])

  const onQ = (v: string) => {
    setQ(v)
    if (activeCat && v) setSelectedId(null)
  }

  // Esc steps back out: directions, then the selected place, then the category.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return
      if (directions) setDirections(false)
      else if (selectedId) {
        setSelectedId(null)
        setLevel(null)
      } else if (activeCat) {
        setActiveCat(null)
        setQ("")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [directions, selectedId, activeCat])

  const highlights: Highlight[] = useMemo(
    () =>
      directions
        ? []
        : catPlaces.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            z: p.z,
            label: p.name,
            icon: activeCat ?? "venue"
          })),
    [catPlaces, activeCat, directions]
  )

  // Markers for the chosen category are drawn as badges, not plain dots.
  const mapCats = useMemo(() => {
    const s = new Set(cats)
    if (activeCat) s.delete(activeCat as LandmarkCat)
    return s
  }, [cats, activeCat])

  // --- floating panels and the room they take ---
  const shellRef = useRef<HTMLDivElement>(null)
  const [shellH, setShellH] = useState(640)
  useEffect(() => {
    const el = shellRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setShellH(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [data])
  const visible = [PEEK, shellH * 0.46, shellH * SHEET_FRACTION]
  const insets = desktop
    ? { left: 384, bottom: 0, top: 0 }
    : { left: 0, bottom: Math.min(visible[detent], shellH * 0.5), top: 108 }

  const panelKey = directions
    ? "directions"
    : selected
      ? `place:${selected.id}`
      : activeCat
        ? `cat:${activeCat}`
        : "explore"

  return (
    <div className="space-y-4">
      <Header
        title="Campus map"
        subtitle={
          <span className="hidden sm:inline">
            Find any lecture theatre, tutorial room, hall or canteen, see which
            level it is on, and get the walk there.
          </span>
        }
      />

      <div
        ref={shellRef}
        className="bg-card relative h-[calc(100dvh-11rem)] min-h-[34rem] overflow-hidden rounded-2xl border lg:h-[calc(100dvh-13rem)]">
        {data ? (
          <>
            <CampusMap
              data={data}
              level={level}
              onLevel={setLevel}
              pins={pins}
              routes={routes}
              onPin={select}
              onPick={select}
              marker={marker}
              selectedId={selectedId}
              mapStyle={mapStyle}
              hybridTone={hybridTone}
              highlights={highlights}
              cats={mapCats}
              buildingLabels={buildingLabels}
              roomLabels={roomLabels}
              focus={focus}
              insets={insets}
              className="absolute inset-0"
              extraControls={
                <MapOptions
                  mapStyle={mapStyle}
                  onMapStyle={setMapStyle}
                  hybridTone={hybridTone}
                  onHybridTone={setHybridTone}
                  cats={cats}
                  onCats={setCats}
                  buildingLabels={buildingLabels}
                  onBuildingLabels={setBuildingLabels}
                  roomLabels={roomLabels}
                  onRoomLabels={setRoomLabels}
                  onReset={resetSettings}
                />
              }
            />

            <div
              className={cn(
                "absolute top-3 right-3 left-3 z-20 flex flex-col gap-2",
                "lg:right-auto lg:w-[360px]"
              )}>
              <SearchPill
                q={q}
                onQ={onQ}
                pending={q !== dq}
                results={results}
                categoryHit={categoryHit}
                onCategory={(key) => chooseCat(key)}
                scope={
                  activeCat
                    ? (BROWSE.find((b) => b.key === activeCat)?.label ?? null)
                    : null
                }
                onClearScope={() => chooseCat(null)}
                onEnterScoped={() => {
                  // Use what is typed now, not the debounced copy.
                  const top = q.trim()
                    ? searchPlaces(catBase, q, 1)[0]
                    : catPlaces[0]
                  if (top) select(top.id)
                }}
                onSelect={select}
                onDirections={() => startDirections(selected?.id)}
              />
            </div>

            <CategoryChips
              active={activeCat}
              onChange={chooseCat}
              className="absolute top-[64px] right-3 left-3 z-10 lg:top-3 lg:right-28 lg:left-[384px]"
            />

            <Sheet
              desktop={desktop}
              detent={detent}
              onDetent={setDetent}
              shellH={shellH}
              visible={visible}>
              <div
                key={panelKey}
                className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
                {directions ? (
                  <DirectionsPanel
                    data={data}
                    places={places}
                    fromId={fromId}
                    toId={toId}
                    setFromId={setFromId}
                    setToId={setToId}
                    from={from}
                    to={to}
                    solo={solo}
                    onClose={() => setDirections(false)}
                  />
                ) : selected ? (
                  <PlacePanel
                    data={data}
                    place={selected}
                    places={places}
                    backLabel={
                      activeCat
                        ? (BROWSE.find((b) => b.key === activeCat)?.label ??
                          "Back")
                        : "Explore"
                    }
                    onBack={() => {
                      setSelectedId(null)
                      setLevel(null)
                    }}
                    level={level}
                    onSelect={select}
                    onLevel={setLevel}
                    onDirections={startDirections}
                  />
                ) : activeCat ? (
                  <CategoryPanel
                    data={data}
                    cat={activeCat}
                    rows={catPlaces}
                    level={level}
                    onLevel={setLevel}
                    onSelect={select}
                    onClose={() => chooseCat(null)}
                  />
                ) : (
                  <ExplorePanel
                    data={data}
                    places={places}
                    onSelect={select}
                    onCat={chooseCat}
                  />
                )}
              </div>
            </Sheet>
          </>
        ) : (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
      </div>
    </div>
  )
}

// --- search ---

const SearchPill = ({
  q,
  onQ,
  pending,
  results,
  categoryHit,
  onCategory,
  scope,
  onClearScope,
  onEnterScoped,
  onSelect,
  onDirections
}: {
  q: string
  onQ: (v: string) => void
  /** The debounced results have not caught up with what was typed yet. */
  pending: boolean
  results: PickerPlace[]
  /** A whole category that matches the query, offered above the rooms. */
  categoryHit: { key: string; label: string; count: number } | null
  onCategory: (key: string) => void
  /** Set while a category is open: the box then filters that list. */
  scope: string | null
  onClearScope: () => void
  onEnterScoped: () => void
  onSelect: (id: string) => void
  onDirections: () => void
}) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const showList = open && !scope && q.trim().length > 0

  return (
    <div className="relative">
      <Command
        shouldFilter={false}
        className={cn(FLOATING, "overflow-visible rounded-full")}>
        <div className="flex h-11 items-center gap-2 pr-1.5 pl-4">
          <Search className="text-muted-foreground size-4 shrink-0" />
          {scope && (
            <button
              type="button"
              onClick={onClearScope}
              aria-label={`Leave ${scope}`}
              className="bg-primary/10 text-primary flex shrink-0 cursor-pointer items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-xs font-semibold transition-transform duration-150 ease-out active:scale-[0.96]">
              {scope}
              <X className="size-3" />
            </button>
          )}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              onQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation()
                if (q) onQ("")
                else inputRef.current?.blur()
              } else if (e.key === "Enter" && scope) onEnterScoped()
            }}
            placeholder={
              scope ? `Search in ${scope}` : "Search a room, building or place"
            }
            aria-label="Search the campus map"
            className="placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                onQ("")
                inputRef.current?.focus()
              }}
              className="hover:bg-accent flex size-8 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.92]">
              <X className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Get directions"
              onClick={onDirections}
              className="bg-primary text-primary-foreground flex size-8 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.92]">
              <Navigation className="size-4" />
            </button>
          )}
        </div>

        {showList && (results.length > 0 || categoryHit || !pending) && (
          <div
            className={cn(
              FLOATING,
              "bg-popover animate-in fade-in-0 zoom-in-95 absolute top-[calc(100%+8px)] right-0 left-0 origin-top overflow-hidden rounded-2xl duration-150 motion-reduce:animate-none"
            )}>
            <CommandList className="max-h-72">
              {results.length === 0 && !categoryHit && (
                <CommandEmpty>No matching place.</CommandEmpty>
              )}
              <CommandGroup>
                {categoryHit && (
                  <CommandItem
                    value={`cat:${categoryHit.key}`}
                    onSelect={() => {
                      onCategory(categoryHit.key)
                      onQ("")
                      setOpen(false)
                      inputRef.current?.blur()
                    }}>
                    <PlaceIcon
                      name={categoryHit.key}
                      className="text-primary size-4"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        All {categoryHit.label.toLowerCase()}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {categoryHit.count} places, browse by level
                      </span>
                    </span>
                  </CommandItem>
                )}
                {results.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onSelect(p.id)
                      onQ("")
                      setOpen(false)
                      inputRef.current?.blur()
                    }}>
                    <PlaceIcon
                      name={placeIcon(p)}
                      className="text-muted-foreground size-4"
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{p.name}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {p.sub}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  )
}

const CategoryChips = ({
  active,
  onChange,
  className
}: {
  active: string | null
  onChange: (key: string | null) => void
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({
    overflow: false,
    left: false,
    right: false
  })
  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdge({
      overflow: el.scrollWidth > el.clientWidth + 4,
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    })
  }, [])
  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update])
  const go = (dir: number) =>
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.7,
      behavior: "smooth"
    })

  // Fade only the side that has more, so a cut-off chip reads as "keep going".
  const fade = `linear-gradient(to right, ${edge.left ? "transparent 0, black 28px" : "black 0"}, ${edge.right ? "black calc(100% - 28px), transparent 100%" : "black 100%"})`

  const arrow = (side: "left" | "right") => (
    <button
      type="button"
      aria-label={
        side === "left"
          ? "Scroll categories back"
          : "Scroll for more categories"
      }
      disabled={!edge[side]}
      onClick={() => go(side === "left" ? -1 : 1)}
      className="bg-foreground text-background flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-md transition-[opacity,transform] duration-150 ease-out enabled:hover:scale-105 enabled:active:scale-[0.92] disabled:cursor-default disabled:opacity-25">
      {side === "left" ? (
        <ChevronLeft className="size-4" />
      ) : (
        <ChevronRight className="size-4" />
      )}
    </button>
  )

  return (
    <div className={cn("flex h-11 items-center gap-2", className)}>
      {edge.overflow && arrow("left")}
      <div
        ref={ref}
        onScroll={update}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
        className="flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BROWSE.map((c) => {
          const on = active === c.key
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : c.key)}
              className={cn(
                FLOATING,
                "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.96]",
                on
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "hover:bg-accent"
              )}>
              <PlaceIcon name={c.key} className="size-3.5" />
              {c.label}
            </button>
          )
        })}
      </div>
      {edge.overflow && arrow("right")}
    </div>
  )
}

/** A scroll area that shows when there is more below: a fade and a "More" button. */
const ScrollHint = ({
  className,
  children
}: {
  className?: string
  children: React.ReactNode
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const update = useCallback(() => {
    const el = ref.current
    if (el) setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8)
  }, [])
  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    // Panels swap their content, so re-check when the children change.
    const mo = new MutationObserver(update)
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [update])
  const fade =
    "linear-gradient(to bottom, black calc(100% - 48px), transparent)"

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={ref}
        onScroll={update}
        style={more ? { maskImage: fade, WebkitMaskImage: fade } : undefined}
        className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
        {children}
      </div>
      {more && (
        <button
          type="button"
          aria-label="Scroll for more"
          onClick={() =>
            ref.current?.scrollBy({
              top: ref.current.clientHeight * 0.7,
              behavior: "smooth"
            })
          }
          className={cn(
            FLOATING,
            "hover:bg-accent animate-in fade-in-0 absolute bottom-2 left-1/2 flex h-7 -translate-x-1/2 cursor-pointer items-center gap-1 rounded-full px-3 text-xs font-medium transition-transform duration-150 ease-out active:scale-[0.96] motion-reduce:animate-none"
          )}>
          More <ChevronDown className="size-3.5" />
        </button>
      )}
    </div>
  )
}

// --- the sheet: a side panel on desktop, a bottom sheet on phones ---

const Sheet = ({
  desktop,
  detent,
  onDetent,
  shellH,
  visible,
  children
}: {
  desktop: boolean
  detent: number
  onDetent: (d: number) => void
  shellH: number
  visible: number[]
  children: React.ReactNode
}) => {
  const [drag, setDrag] = useState<number | null>(null)
  const track = useRef<{
    y: number
    v0: number
    last: [number, number][]
    moved: boolean
  } | null>(null)

  if (desktop)
    return (
      <div
        className={cn(
          FLOATING,
          "bg-card/95 absolute top-[68px] left-3 z-10 flex max-h-[calc(100%-80px)] w-[360px] flex-col overflow-hidden rounded-2xl"
        )}>
        <ScrollHint className="p-4">{children}</ScrollHint>
      </div>
    )

  const sheetH = shellH * SHEET_FRACTION
  const shown = drag ?? visible[detent]

  return (
    <div
      className="bg-card absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t shadow-[0_-8px_30px_-12px_hsl(var(--foreground)/0.25)]"
      style={{
        height: sheetH,
        transform: `translateY(${sheetH - shown}px)`,
        transition:
          drag === null
            ? "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)"
            : "none"
      }}>
      <div
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          track.current = {
            y: e.clientY,
            v0: visible[detent],
            last: [[e.clientY, performance.now()]],
            moved: false
          }
        }}
        onPointerMove={(e) => {
          const t = track.current
          if (!t) return
          if (Math.abs(t.y - e.clientY) > 3) t.moved = true
          if (!t.moved) return
          t.last = [...t.last.slice(-3), [e.clientY, performance.now()]]
          // Past the ends the sheet resists instead of stopping dead.
          const raw = t.v0 + (t.y - e.clientY)
          const lo = visible[0]
          const hi = visible[2]
          setDrag(
            raw < lo
              ? lo - (lo - raw) * 0.35
              : raw > hi
                ? hi + (raw - hi) * 0.35
                : raw
          )
        }}
        onPointerUp={() => {
          const t = track.current
          track.current = null
          if (!t) return
          if (!t.moved) {
            onDetent(detent === 2 ? 1 : 2)
            return
          }
          const [a, b] = [t.last[0], t.last[t.last.length - 1]]
          const v = b[1] > a[1] ? ((a[0] - b[0]) / (b[1] - a[1])) * 1000 : 0
          const rest = (drag ?? visible[detent]) + project1d(v)
          const next = visible.reduce(
            (best, h, i) =>
              Math.abs(h - rest) < Math.abs(visible[best] - rest) ? i : best,
            0
          )
          onDetent(next)
          setDrag(null)
        }}>
        <span className="bg-muted-foreground/40 h-1 w-10 rounded-full" />
      </div>
      <ScrollHint className="px-4 pb-6">{children}</ScrollHint>
    </div>
  )
}

// --- panels ---

const IconTile = ({
  icon,
  className
}: {
  icon: string
  className?: string
}) => {
  return (
    <span
      className={cn(
        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl",
        className
      )}>
      <PlaceIcon name={icon} className="size-5" />
    </span>
  )
}

const ExplorePanel = ({
  data,
  places,
  onSelect,
  onCat
}: {
  data: VenueData
  places: PickerPlace[]
  onSelect: (id: string) => void
  onCat: (key: string) => void
}) => {
  const popular = useMemo(
    () =>
      Object.entries(data.venues)
        .filter(([, v]) => v.how !== "fuzzy" && /^[A-Za-z0-9]/.test(v.name))
        .sort((a, b) => b[1].slots - a[1].slots)
        .slice(0, 8)
        .map(([k]) => k),
    [data]
  )
  const count = (key: string) =>
    key === "lt"
      ? places.filter(isLectureTheatre).length
      : places.filter((p) => p.cat === key).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg leading-tight font-semibold">
          Find your way around NTU
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Search for a room, or tap a building on the map.
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Busy rooms this semester</h3>
        <div className="flex flex-wrap gap-1.5">
          {popular.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(`v:${k}`)}
              className="hover:bg-accent cursor-pointer rounded-full border px-3 py-1 text-sm transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]">
              {k}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Browse by type</h3>
        <ul className="-mx-2 space-y-0.5">
          {BROWSE.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onCat(c.key)}
                className="group hover:bg-accent focus-visible:ring-ring/50 flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-[3px] active:scale-[0.99]">
                <span className="bg-muted group-hover:bg-background flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150">
                  <PlaceIcon name={c.key} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {c.label}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {count(c.key)}
                </span>
                <ChevronRight className="text-muted-foreground -ml-1 size-4 -translate-x-1 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** "Female Toilet (North Spine)" -> ["Female Toilet", "North Spine"]. */
const splitName = (name: string): [string, string | null] => {
  const m = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/)
  return m ? [m[1], m[2]] : [name, null]
}

const CategoryPanel = ({
  data,
  cat,
  rows,
  level,
  onLevel,
  onSelect,
  onClose
}: {
  data: VenueData
  cat: string
  rows: PickerPlace[]
  level: number | null
  onLevel: (z: number | null) => void
  onSelect: (id: string) => void
  onClose: () => void
}) => {
  const label = BROWSE.find((b) => b.key === cat)?.label ?? cat
  // Hundreds of toilets are only useful one level at a time.
  const big = rows.length > 150
  const levels = useMemo(() => {
    const count = new Map<number, number>()
    for (const r of rows)
      if (r.z !== 0) count.set(r.z, (count.get(r.z) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[0] - a[0])
  }, [rows])
  const shown = big
    ? level === null
      ? []
      : rows.filter((r) => r.z === level)
    : rows

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <IconTile icon={cat} />
        <div className="min-w-0 flex-1">
          <h2 className="leading-tight font-semibold">{label}</h2>
          <p className="text-muted-foreground text-xs tabular-nums">
            {rows.length} on the map
          </p>
        </div>
        <HeaderShare title={label} />
        <button
          type="button"
          aria-label="Close list"
          onClick={onClose}
          className="hover:bg-accent flex size-8 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.92]">
          <X className="size-4" />
        </button>
      </div>

      {big && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Pick a level</h3>
          <div className="flex flex-wrap gap-1.5">
            {levels.map(([z, n]) => (
              <button
                key={z}
                type="button"
                aria-pressed={level === z}
                onClick={() => level !== z && onLevel(z)}
                className={cn(
                  "min-w-10 rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums transition-[transform,background-color] duration-150 ease-out",
                  level === z
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "hover:bg-accent cursor-pointer active:scale-[0.96]"
                )}
                title={`${n} on ${levelLabel(data, z)}`}>
                {levelShort(data, z)}
              </button>
            ))}
          </div>
          {level === null && (
            <p className="text-muted-foreground text-xs">
              {label} are on almost every floor. Pick a level to list them and
              see them on the map.
            </p>
          )}
        </section>
      )}

      {rows.length === 0 && (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Nothing in {label.toLowerCase()} matches that.
        </p>
      )}
      <ul className="divide-y">
        {shown.map((p) => {
          const [main, extra] = splitName(p.name)
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className="hover:bg-accent -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition-colors">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{main}</span>
                  {extra && (
                    <span className="text-muted-foreground block truncate text-xs">
                      {extra}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {p.z !== 0
                    ? levelShort(data, p.z)
                    : p.kind === "landmark"
                      ? "Outdoors"
                      : ""}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const Pill = ({
  children,
  onClick,
  active
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
}) => {
  const cls = cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
  )
  return onClick ? (
    <button
      type="button"
      onClick={active ? undefined : onClick}
      aria-pressed={active}
      className={cn(
        cls,
        !active &&
          "hover:bg-accent cursor-pointer transition-transform duration-150 ease-out active:scale-[0.96]"
      )}>
      {children}
    </button>
  ) : (
    <span className={cls}>{children}</span>
  )
}

const PlacePanel = ({
  data,
  place,
  places,
  backLabel,
  level,
  onBack,
  onSelect,
  onLevel,
  onDirections
}: {
  data: VenueData
  place: PickerPlace
  places: PickerPlace[]
  backLabel: string
  /** The level the map is showing now, so its chip reads as selected. */
  level: number | null
  onBack: () => void
  onSelect: (id: string) => void
  onLevel: (z: number | null) => void
  onDirections: (id?: string, as?: "from" | "to") => void
}) => {
  const venue = place.kind === "venue" ? data.venues[place.name] : undefined
  const building = data.buildings.find((b) => b.id === place.b)
  const inside =
    place.kind === "building"
      ? sortPlaces(
          places.filter(
            (p) =>
              p.kind === "venue" &&
              p.b === place.b &&
              /^[A-Za-z0-9]/.test(p.name)
          )
        )
      : []

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground -ml-1 flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors">
        <ArrowLeft className="size-3.5" /> {backLabel}
      </button>

      <div className="flex items-start gap-3">
        <IconTile icon={placeIcon(place)} />
        <div className="min-w-0">
          <h2 className="text-lg leading-tight font-semibold break-words">
            {place.name}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">{place.sub}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {place.kind !== "building" &&
          (place.z !== 0 ? (
            <Pill active={level === place.z} onClick={() => onLevel(place.z)}>
              {levelLabel(data, place.z)}
            </Pill>
          ) : place.kind === "venue" ? (
            <Pill>Level not listed</Pill>
          ) : (
            <Pill>Outdoors</Pill>
          ))}
        {building && place.kind !== "building" && (
          <Pill onClick={() => onSelect(`b:${building.id}`)}>
            {building.short}
          </Pill>
        )}
        {venue?.code && <Pill>{venue.code}</Pill>}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => onDirections(place.id, "to")}>
          <Navigation /> Directions
        </Button>
        <Button
          variant="outline"
          onClick={() => onDirections(place.id, "from")}>
          From here
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Share this view"
          onClick={() => shareLink(place.name)}>
          <Share2 />
        </Button>
      </div>

      {venue?.how === "fuzzy" && (
        <p className="bg-muted text-muted-foreground rounded-xl px-3 py-2.5 text-xs leading-relaxed">
          This venue was matched to the map by name, so the pin may be a little
          off. Check the room number when you arrive.
        </p>
      )}

      {place.kind === "building" && building && (
        <div className="space-y-4">
          {building.levels.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Floor plans</h3>
              <div className="flex flex-wrap gap-1.5">
                {[...building.levels]
                  .sort((a, b) => b - a)
                  .map((z) => (
                    <button
                      key={z}
                      type="button"
                      aria-pressed={level === z}
                      onClick={() => level !== z && onLevel(z)}
                      className={cn(
                        "min-w-10 rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums transition-[transform,background-color] duration-150 ease-out",
                        level === z
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "hover:bg-accent cursor-pointer active:scale-[0.96]"
                      )}>
                      {levelShort(data, z)}
                    </button>
                  ))}
              </div>
            </section>
          )}
          {inside.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Classrooms here</h3>
              <div className="flex flex-wrap gap-1.5">
                {inside.slice(0, 30).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className="hover:bg-accent cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]">
                    {p.name}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

const DirectionsPanel = ({
  data,
  places,
  fromId,
  toId,
  setFromId,
  setToId,
  from,
  to,
  solo,
  onClose
}: {
  data: VenueData
  places: PickerPlace[]
  fromId: string | null
  toId: string | null
  setFromId: (id: string | null) => void
  setToId: (id: string | null) => void
  from?: PickerPlace
  to?: PickerPlace
  solo: { walk: WalkResult; estimated: boolean } | null
  onClose: () => void
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg leading-tight font-semibold">Directions</h2>
      <div className="-mr-1 flex items-center">
        <HeaderShare title="NTU walking directions" />
        <button
          type="button"
          aria-label="Close directions"
          onClick={onClose}
          className="hover:bg-accent flex size-8 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.92]">
          <X className="size-4" />
        </button>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-0.5 py-1" aria-hidden>
        <span className="border-primary size-2.5 rounded-full border-2" />
        <span className="bg-border h-6 w-px" />
        <span className="bg-primary size-2.5 rounded-full" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <PlacePicker
          label="From"
          places={places}
          value={fromId}
          onChange={setFromId}
        />
        <PlacePicker
          label="To"
          places={places}
          value={toId}
          onChange={setToId}
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Swap from and to"
        disabled={!fromId && !toId}
        onClick={() => {
          setFromId(toId)
          setToId(fromId)
        }}>
        <ArrowDownUp />
      </Button>
    </div>

    {from && to && solo ? (
      <Route data={data} from={from.name} to={to.name} result={solo} />
    ) : (
      <p className="text-muted-foreground text-sm">
        {from && to
          ? "Working out the walk..."
          : "Pick a start and an end to see the walk, with the levels and stairs or lifts to take."}
      </p>
    )}
  </div>
)

const Route = ({
  data,
  from,
  to,
  result
}: {
  data: VenueData
  from: string
  to: string
  result: { walk: WalkResult; estimated: boolean }
}) => {
  const { walk } = result
  const minutes = Math.max(1, Math.ceil(walk.seconds / 60))
  type Step = { icon: "walk" | "stairs" | "lift"; text: string; meta?: string }
  const steps: Step[] = []
  walk.segments.forEach((s, i) => {
    const m = Math.max(polyMetres(data, s.pts), 5)
    const c = walk.changes[i]
    steps.push({
      icon: "walk",
      text: s.z ? `Walk on ${levelLabel(data, s.z)}` : "Walk outside",
      meta: `${m} m`
    })
    if (c)
      steps.push({
        icon: c.stairs ? "stairs" : "lift",
        text: `Take the ${c.stairs ? "stairs" : "lift or stairs"} ${c.to > c.from ? "up" : "down"} to ${levelLabel(data, c.to)}`
      })
  })

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <p className="text-4xl leading-none font-semibold tabular-nums">
          {minutes}
          <span className="text-muted-foreground ml-1 text-base font-medium">
            min
          </span>
        </p>
        <p className="text-muted-foreground text-sm tabular-nums">
          {walk.metres} m{result.estimated && " · estimated"}
        </p>
      </div>

      <ol>
        <TimelineRow
          icon={
            <span className="border-primary size-2.5 rounded-full border-2" />
          }
          text={from}
          strong
        />
        {steps.map((s, i) => (
          <TimelineRow
            key={i}
            icon={
              s.icon === "walk" ? (
                <Footprints className="size-3.5" />
              ) : s.icon === "stairs" ? (
                <StairIcon />
              ) : (
                <ArrowUpDown className="size-3.5" />
              )
            }
            text={s.text}
            meta={s.meta}
          />
        ))}
        <TimelineRow
          icon={<span className="bg-primary size-2.5 rounded-full" />}
          text={to}
          strong
          last
        />
      </ol>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Walking time is an estimate at an easy pace and includes stairs and
        lifts. Allow extra at busy class changes.
      </p>
    </div>
  )
}

const StairIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden>
    <path d="M3 20h5v-5h5v-5h5V5h3" />
  </svg>
)

const TimelineRow = ({
  icon,
  text,
  meta,
  strong,
  last
}: {
  icon: React.ReactNode
  text: string
  meta?: string
  strong?: boolean
  last?: boolean
}) => (
  <li className="flex gap-3">
    <div className="flex w-6 flex-col items-center">
      <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full">
        {icon}
      </span>
      {!last && <span className="bg-border my-0.5 w-px flex-1" />}
    </div>
    <div
      className={cn(
        "flex min-w-0 flex-1 justify-between gap-3 pb-3",
        last && "pb-0"
      )}>
      <p
        className={cn(
          "pt-0.5 text-sm",
          strong ? "font-semibold" : "text-muted-foreground"
        )}>
        {text}
      </p>
      {meta && (
        <p className="text-muted-foreground pt-0.5 text-xs tabular-nums">
          {meta}
        </p>
      )}
    </div>
  </li>
)

export default MapsPageContent
