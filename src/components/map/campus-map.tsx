"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"
import {
  CircleHelp,
  LocateFixed,
  Maximize2,
  Minimize2,
  Minus,
  Plus
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  legColour,
  levelLabel,
  levelShort,
  linesPath,
  loadChunk,
  loadTerrain,
  project,
  ringsBounds,
  ringsCentre,
  ringsPath,
  type BuildingChunk,
  type HybridTone,
  type LandmarkCat,
  type LegStatus,
  type Room,
  type Terrain,
  type VenueData,
  type WalkResult
} from "@/lib/venue-map"
import { PlaceIcon } from "@/components/map/category-icons"
import { MapMenu } from "@/components/map/map-menu"

export interface Pin {
  id: string
  x: number
  y: number
  z: number
  /** Short text next to the pin, e.g. "CZ2001". */
  label: string
  /** Stop numbers shown inside the pin. */
  numbers: number[]
  /** CSS colour of the pin's ring (class type). */
  colour: string
  approx?: boolean
  /** Building the stop is in, so it can be highlighted. */
  building?: number | null
}

export interface RouteLayer {
  id: string
  walk: WalkResult
  status: LegStatus
  active: boolean
}

export interface Focus {
  /** [minX, minY, maxX, maxY] in metres. */
  bounds: [number, number, number, number]
  nonce: number
}

/** A place the student is looking at: drawn as a drop-pin with its name. */
export interface Marker {
  x: number
  y: number
  z: number
  label: string
  /** Key into PLACE_ICON. */
  icon: string
  /** Set when the place is a whole building: it is outlined instead of pinned. */
  building?: number | null
  /** Set when the place is a class venue whose room may be labelled already. */
  venue?: string
}

/** A search result or category pick, drawn as an icon badge on the map. */
export interface Highlight {
  id: string
  x: number
  y: number
  z: number
  label: string
  /** Key into PLACE_ICON. */
  icon: string
}

interface Props {
  data: VenueData
  /** null = campus overview; otherwise the level whose floor plans are shown. */
  level: number | null
  onLevel: (z: number | null) => void
  pins: Pin[]
  routes: RouteLayer[]
  selectedPin?: string
  onPin: (id: string) => void
  cats: Set<LandmarkCat>
  buildingLabels: boolean
  roomLabels: boolean
  focus: Focus | null
  marker?: Marker | null
  selectedId?: string | null
  mapStyle?: "standard" | "satellite" | "hybrid"
  /** Hybrid only: grey boxes, or dark blue for a clearer read over imagery. */
  hybridTone?: HybridTone
  highlights?: Highlight[]
  /** Pixels covered by floating panels, so framing and controls avoid them. */
  insets?: { left: number; bottom: number; top: number }
  /** Extra buttons stacked above the level button, top right. */
  extraControls?: React.ReactNode
  /** Shows a help button under the zoom controls. */
  onHelp?: () => void
  /** Tap a building, landmark or class room: "b:<id>", "l:<id>" or "v:<venue>". */
  onPick?: (id: string) => void
  /** Fill the screen: phones get the whole viewport instead of a squeezed box. */
  fullscreen?: boolean
  onFullscreen?: () => void
  /** The box is laid out fullscreen (also true while it shrinks back). */
  pinned?: boolean
  /** Skip the controls' slide while the box itself is resizing. */
  snap?: boolean
  className?: string
}

const INTRO_KEY = "ntumods-map-fullscreen-intro"

interface View {
  cx: number
  cy: number
  /** Metres per screen pixel. */
  mpp: number
}

/** What is selected is never the same blue as the things around it. */
const SELECTED = "hsl(var(--index-prj-border))"
const HYBRID_FILL: Record<HybridTone, string> = {
  grey: "fill-black/30 stroke-white/70",
  darkgrey: "fill-black/65 stroke-white/60",
  blue: "fill-[#0a1f5c]/70 stroke-sky-300/70",
  darkblue: "fill-[#050d2e]/80 stroke-sky-300/60"
}
const MIN_MPP = 0.06
const MAX_MPP = 3
const ROOM_TYPES_TEACHING =
  /lecture|tutorial|seminar|lab|studio|auditorium|exam/i

/** Top-right stack (options, level, fullscreen) reaches this far down. */
const CONTROLS_TOP = 160
/** Zoom, fit and help stacked: it shows only when all of it fits above the sheet. */
const STACK_H = 82 + 48 * 2 + 8

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const CampusMap = ({
  data,
  level,
  onLevel,
  pins,
  routes,
  selectedPin,
  onPin,
  cats,
  buildingLabels,
  roomLabels,
  focus,
  marker,
  selectedId,
  mapStyle = "standard",
  hybridTone = "grey",
  highlights,
  insets = { left: 0, bottom: 0, top: 0 },
  extraControls,
  onHelp,
  onPick,
  fullscreen = false,
  onFullscreen,
  pinned = false,
  snap = false,
  className
}: Props) => {
  // First visit: dim the app and point at the fullscreen button until it is used.
  const [intro, setIntro] = useState(false)
  const stackFits = (h: number) =>
    h - insets.top - CONTROLS_TOP - insets.bottom - 12 >= STACK_H
  useEffect(() => {
    try {
      if (!fullscreen && !localStorage.getItem(INTRO_KEY)) setIntro(true)
    } catch {}
  }, [fullscreen])
  useEffect(() => {
    if (!intro) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [intro])
  useEffect(() => {
    if (!fullscreen) return
    setIntro(false)
    try {
      localStorage.setItem(INTRO_KEY, "1")
    } catch {}
  }, [fullscreen])
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<View>({
    cx: data.size.width / 2,
    cy: data.size.height / 2,
    mpp: 2.6
  })
  const viewRef = useRef(view)
  viewRef.current = view
  const [chunks, setChunks] = useState<Record<number, BuildingChunk>>({})
  const [terrain, setTerrain] = useState<Terrain | null>(null)
  const anim = useRef(0)
  /** Where a running camera move is headed; null when idle. */
  const camTarget = useRef<View | null>(null)
  const [levelsOpen, setLevelsOpen] = useState(false)

  // Keep the camera over the campus: it can be panned to the edge and no further.
  const limits = useMemo(() => {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity
    for (const b of data.buildings) {
      const r = ringsBounds(b.rings)
      x0 = Math.min(x0, r[0])
      y0 = Math.min(y0, r[1])
      x1 = Math.max(x1, r[2])
      y1 = Math.max(y1, r[3])
    }
    return { x0, y0, x1, y1 }
  }, [data.buildings])

  // The middle of what the panels leave uncovered must stay over the campus,
  // and a quarter of that view in from the edge, so you never see mostly blank.
  const clampView = useCallback(
    (v: View): View => {
      const mpp = clamp(v.mpp, MIN_MPP, MAX_MPP)
      const ox = (insets.left / 2) * mpp
      const oy = ((insets.top - insets.bottom) / 2) * mpp
      const mx = Math.min(
        0.25 * Math.max(size.w - insets.left, 0) * mpp,
        (limits.x1 - limits.x0) / 2
      )
      const my = Math.min(
        0.25 * Math.max(size.h - insets.top - insets.bottom, 0) * mpp,
        (limits.y1 - limits.y0) / 2
      )
      return {
        cx: clamp(v.cx + ox, limits.x0 + mx, limits.x1 - mx) - ox,
        cy: clamp(v.cy + oy, limits.y0 + my, limits.y1 - my) - oy,
        mpp
      }
    },
    [limits, size.w, size.h, insets.left, insets.top, insets.bottom]
  )

  // --- size ---
  // Where the box centre sits on screen. When the box jumps (fullscreen on or
  // off) the camera shifts by the same amount, so the map stays put under the
  // finger instead of sliding to the new centre.
  const centre = useRef<{ x: number; y: number } | null>(null)
  const relayout = useRef(false)
  useLayoutEffect(() => {
    relayout.current = true
  }, [pinned])
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      return { x: r.left + el.clientWidth / 2, y: r.top + el.clientHeight / 2 }
    }
    const ro = new ResizeObserver(() => {
      const now = measure()
      const was = centre.current
      if (relayout.current && was) {
        const v = viewRef.current
        cancelAnimationFrame(anim.current)
        camTarget.current = null
        setView({
          cx: v.cx + (now.x - was.x) * v.mpp,
          cy: v.cy + (now.y - was.y) * v.mpp,
          mpp: v.mpp
        })
      }
      relayout.current = false
      centre.current = now
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    const onScroll = () => (centre.current = measure())
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  // --- camera ---
  const flyTo = useCallback(
    (target: View) => {
      const to = clampView(target)
      cancelAnimationFrame(anim.current)
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      if (reduce) return setView(to)
      // Chase the target instead of tweening to it: aiming somewhere new
      // mid-flight keeps the speed, so repeated taps feel continuous.
      camTarget.current = to
      let last = performance.now()
      const step = (now: number) => {
        const goal = camTarget.current
        if (!goal) return
        const v = viewRef.current
        const k = 1 - Math.exp(-(now - last) / 55)
        last = now
        const mpp = Math.exp(
          Math.log(v.mpp) + (Math.log(goal.mpp) - Math.log(v.mpp)) * k
        )
        const done =
          Math.abs(Math.log(goal.mpp / mpp)) < 0.002 &&
          Math.hypot(goal.cx - v.cx, goal.cy - v.cy) < 0.3 * mpp
        setView(
          done
            ? goal
            : {
                cx: v.cx + (goal.cx - v.cx) * k,
                cy: v.cy + (goal.cy - v.cy) * k,
                mpp
              }
        )
        if (done) camTarget.current = null
        else anim.current = requestAnimationFrame(step)
      }
      anim.current = requestAnimationFrame(step)
    },
    [clampView]
  )

  const fit = useCallback(
    (b: [number, number, number, number], pad = 56) => {
      const w = Math.max(b[2] - b[0], 30)
      const h = Math.max(b[3] - b[1], 30)
      const availW = Math.max(size.w - insets.left - pad * 2, 100)
      const availH = Math.max(
        size.h - insets.bottom - insets.top - pad * 2,
        100
      )
      const mpp = clamp(Math.max(w / availW, h / availH), MIN_MPP, MAX_MPP)
      // Put the area's centre in the middle of what is not covered by panels.
      const shiftX = (insets.left / 2) * mpp
      const shiftY = ((insets.top - insets.bottom) / 2) * mpp
      flyTo({
        cx: (b[0] + b[2]) / 2 - shiftX,
        cy: (b[1] + b[3]) / 2 - shiftY,
        mpp
      })
    },
    [flyTo, size.h, size.w, insets.left, insets.bottom, insets.top]
  )

  // Frame the requested area once the map knows its own size.
  const measured = size.w > 0
  useEffect(() => {
    if (focus && measured) fit(focus.bounds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce, measured])

  const zoomBy = (factor: number) => {
    // Taps stack: zoom from where the camera is going, not where it is.
    const v = camTarget.current ?? viewRef.current
    flyTo({ ...v, mpp: clamp(v.mpp * factor, MIN_MPP, MAX_MPP) })
  }

  const zoomAt = (px: number, py: number, factor: number) => {
    const v = viewRef.current
    const mpp = clamp(v.mpp * factor, MIN_MPP, MAX_MPP)
    // Keep the point under the cursor fixed.
    const wx = v.cx + (px - size.w / 2) * v.mpp
    const wy = v.cy + (py - size.h / 2) * v.mpp
    setView(
      clampView({
        cx: wx - (px - size.w / 2) * mpp,
        cy: wy - (py - size.h / 2) * mpp,
        mpp
      })
    )
  }

  // --- pointer: drag to pan, pinch to zoom, wheel to zoom ---
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const dragged = useRef(false)
  /** Where the finger or cursor went down, to tell a tap from a drag. */
  const downAt = useRef({ x: 0, y: 0 })
  const pinch = useRef(0)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cancelAnimationFrame(anim.current)
      camTarget.current = null
      const r = el.getBoundingClientRect()
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(e.deltaY * 0.0016))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h])

  const onPointerDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(anim.current)
    camTarget.current = null
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    dragged.current = false
    downAt.current = { x: e.clientX, y: e.clientY }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const cur = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, cur)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch.current) {
        const r = box.current!.getBoundingClientRect()
        zoomAt(
          (a.x + b.x) / 2 - r.left,
          (a.y + b.y) / 2 - r.top,
          pinch.current / d
        )
      }
      pinch.current = d
      dragged.current = true
      return
    }
    const dx = cur.x - prev.x
    const dy = cur.y - prev.y
    // A drag starts once the finger has moved far enough from where it went
    // down, however slowly. Until then it is still a tap, so a wobbly press on
    // a building selects it and a slow pan never does.
    if (
      !dragged.current &&
      Math.hypot(cur.x - downAt.current.x, cur.y - downAt.current.y) <
        (e.pointerType === "touch" ? 10 : 4)
    )
      return
    if (!dragged.current) box.current?.setPointerCapture(e.pointerId)
    dragged.current = true
    const v = viewRef.current
    setView(clampView({ ...v, cx: v.cx - dx * v.mpp, cy: v.cy - dy * v.mpp }))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    pinch.current = 0
  }

  // --- floor plans: load every indoor building once a level is chosen ---
  const levelSet = useMemo(() => {
    const s = new Set<number>()
    for (const b of data.buildings)
      if (b.indoor) for (const z of b.levels) s.add(z)
    return s
  }, [data.buildings])

  // Floor plans load for the buildings on screen (and a margin), not the campus.
  const footprints = useMemo(
    () => new Map(data.buildings.map((b) => [b.id, ringsBounds(b.rings)])),
    [data.buildings]
  )
  useEffect(() => {
    if (level === null || !size.w) return
    let live = true
    const m = 120
    const x0 = view.cx - (size.w * view.mpp) / 2 - m
    const x1 = view.cx + (size.w * view.mpp) / 2 + m
    const y0 = view.cy - (size.h * view.mpp) / 2 - m
    const y1 = view.cy + (size.h * view.mpp) / 2 + m
    for (const b of data.buildings) {
      if (!b.indoor || !b.levels.includes(level)) continue
      const f = footprints.get(b.id)!
      if (f[2] < x0 || f[0] > x1 || f[3] < y0 || f[1] > y1) continue
      loadChunk(b.id).then((c) => {
        if (live && c)
          setChunks((prev) => (prev[b.id] ? prev : { ...prev, [b.id]: c }))
      })
    }
    return () => {
      live = false
    }
  }, [
    level,
    data.buildings,
    footprints,
    view.cx,
    view.cy,
    view.mpp,
    size.w,
    size.h
  ])

  // --- derived geometry ---
  const { cx, cy, mpp } = view
  // Hundreds of badges at campus scale is noise: wait for a level or a closer view.
  const crowded = (highlights?.length ?? 0) > 150 && level === null && mpp > 0.8
  const vw = size.w * mpp
  const vh = size.h * mpp
  const vx = cx - vw / 2
  const vy = cy - vh / 2
  const inView = (b: [number, number, number, number], pad = 0) =>
    b[2] >= vx - pad &&
    b[0] <= vx + vw + pad &&
    b[3] >= vy - pad &&
    b[1] <= vy + vh + pad

  const buildings = useMemo(
    () =>
      data.buildings.map((b) => ({
        ...b,
        d: ringsPath(b.rings),
        bounds: ringsBounds(b.rings),
        centre: ringsCentre(b.rings)
      })),
    [data.buildings]
  )

  // Floors that exist at this level, with their paths built once.
  const floors = useMemo(() => {
    if (level === null) return []
    return Object.values(chunks).flatMap((c) => {
      const f = c.floors[String(level)]
      if (!f) return []
      const venueRooms = f.rooms.filter((r) => r.v)
      const teaching = f.rooms.filter(
        (r) => !r.v && r.t && ROOM_TYPES_TEACHING.test(r.t)
      )
      const other = f.rooms.filter(
        (r) => !r.v && !(r.t && ROOM_TYPES_TEACHING.test(r.t))
      )
      const all = f.outline.length ? f.outline : f.rooms.flatMap((r) => r.r)
      return [
        {
          id: c.id,
          bounds: ringsBounds(all),
          outline: ringsPath(f.outline),
          halls: ringsPath(f.halls.flat()),
          other: ringsPath(other.flatMap((r) => r.r)),
          teaching: ringsPath(teaching.flatMap((r) => r.r)),
          stairs: ringsPath(f.stairs.flat()),
          lifts: ringsPath(f.lifts.flat()),
          venueRooms: venueRooms.map((r) => ({ room: r, d: ringsPath(r.r) })),
          labelled: f.rooms.filter((r) => r.v || r.n || r.c)
        }
      ]
    })
  }, [chunks, level])

  const hasFloor = useMemo(() => {
    const s = new Set<number>()
    if (level === null) return s
    for (const b of data.buildings)
      if (b.indoor && b.levels.includes(level)) s.add(b.id)
    return s
  }, [data.buildings, level])

  // Buildings holding a stop on screen: the only ones tinted.
  const activeBuildings = useMemo(
    () => new Set(pins.flatMap((p) => (p.building ? [p.building] : []))),
    [pins]
  )

  // Busiest buildings first, so zoomed-out maps label only the landmarks of campus.
  const ranked = useMemo(
    () =>
      new Map(
        buildings
          .filter((b) => b.slots && !b.hall)
          .sort((a, b) => b.slots - a.slots)
          .map((b, i) => [b.id, i])
      ),
    [buildings]
  )

  // --- labels: what shows depends on zoom, then collisions are dropped ---
  const labels = useMemo(() => {
    type Cand = {
      key: string
      x: number
      y: number
      text: string
      prio: number
      cls: string
      muted?: boolean
    }
    const out: Cand[] = []
    const toPx = (x: number, y: number) =>
      [(x - vx) / mpp, (y - vy) / mpp] as const

    // Boxes already spoken for: stop pins come first, so nothing prints over them.
    const taken: [number, number, number, number][] = []
    // A venue's room already carries its own label on a level plan.
    const roomLabelsOn = level !== null && roomLabels && mpp < 0.3

    for (const p of pins) {
      if (level !== null && p.z !== level) continue
      if (roomLabelsOn) continue
      const [x, y] = toPx(p.x, p.y)
      taken.push([x - 18, y - 14, x + 18, y + 14])
      out.push({
        key: `pin:${p.id}`,
        x,
        y: y + 24,
        text: p.label,
        prio: 100,
        cls: "font-semibold"
      })
    }

    for (const h of highlights ?? []) {
      if (crowded || mpp >= 1.3 || h.id === selectedId) continue
      if (roomLabelsOn && h.icon === "lt") continue
      if (level !== null && h.z !== 0 && h.z !== level) continue
      const [x, y] = toPx(h.x, h.y)
      taken.push([x - 13, y - 13, x + 13, y + 13])
      out.push({
        key: `h:${h.id}`,
        x,
        y: y + 22,
        text: h.label.replace(/\s*\(.*?\)\s*$/, ""),
        prio: 70,
        cls: "font-semibold"
      })
    }

    if (
      marker &&
      !(roomLabelsOn && marker.venue) &&
      (level === null || marker.z === level || marker.z === 0)
    ) {
      const [x, y] = toPx(marker.x, marker.y)
      taken.push([x - 14, y - 36, x + 14, y + 4])
      out.push({
        key: "marker",
        x,
        y: y + 14,
        text: marker.label,
        prio: 99,
        cls: "font-semibold"
      })
    }

    if (buildingLabels) {
      const topN = mpp > 1.6 ? 5 : mpp > 0.9 ? 12 : mpp > 0.5 ? 28 : 999
      for (const b of buildings) {
        if (b.hall || !b.slots || !inView(b.bounds, 60)) continue
        if (level !== null && hasFloor.has(b.id)) continue
        const active = activeBuildings.has(b.id)
        if (!active && (ranked.get(b.id) ?? 999) >= topN) continue
        const [x, y] = toPx(...b.centre)
        out.push({
          key: `b:${b.id}`,
          x,
          y,
          text: b.short,
          prio: active ? 60 : 40 - Math.min(ranked.get(b.id) ?? 30, 30),
          cls: ""
        })
      }
    }

    for (const l of data.landmarks) {
      if (!cats.has(l.c)) continue
      if (level !== null && l.b !== null && l.z !== level) continue
      // Halls are named from afar; everything else only once you are close.
      const near = l.c === "hall" ? 1.6 : l.c === "transport" ? 0.8 : 0.45
      if (mpp >= near) continue
      if (
        l.x < vx - 40 ||
        l.x > vx + vw + 40 ||
        l.y < vy - 40 ||
        l.y > vy + vh + 40
      )
        continue
      const [x, y] = toPx(l.x, l.y)
      out.push({
        key: `l:${l.id}`,
        x,
        y: y + 13,
        text: l.n.replace(/\s*\(.*?\)\s*$/, ""),
        prio: l.c === "hall" ? 30 : 10,
        cls: "",
        muted: true
      })
    }

    out.sort((a, b) => b.prio - a.prio)
    return out
      .filter((c) => {
        const w = c.text.length * 5.8 + 12
        const box: [number, number, number, number] = [
          c.x - w / 2,
          c.y - 9,
          c.x + w / 2,
          c.y + 9
        ]
        if (
          taken.some(
            (t) =>
              box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1]
          )
        )
          return false
        taken.push(box)
        return true
      })
      .slice(0, 45)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pins,
    marker,
    selectedId,
    highlights,
    crowded,
    roomLabels,
    buildings,
    ranked,
    activeBuildings,
    data.landmarks,
    cats,
    level,
    buildingLabels,
    hasFloor,
    cx,
    cy,
    mpp,
    size.w,
    size.h
  ])

  const px = mpp // 1 screen pixel in metres
  // Satellite and hybrid share imagery; hybrid also draws standard-style boxes.
  const sat = mapStyle !== "standard"
  const boxes = mapStyle !== "satellite"

  // Web-mercator tiles covering the view, placed in the map's own metres.
  const tiles = useMemo(() => {
    if (!sat || !size.w) return []
    const { origin } = data
    const rad = Math.PI / 180
    const z = clamp(
      Math.round(Math.log2((156543.03 * Math.cos(1.348 * rad)) / mpp)),
      15,
      19
    )
    const n = 2 ** z
    const lonAt = (x: number) => origin.lon0 + x / origin.mPerLon
    const latAt = (y: number) => origin.lat1 - y / origin.mPerLat
    const tx = (lon: number) => Math.floor(((lon + 180) / 360) * n)
    const ty = (lat: number) =>
      Math.floor(
        ((1 -
          Math.log(Math.tan(lat * rad) + 1 / Math.cos(lat * rad)) / Math.PI) /
          2) *
          n
      )
    const tileLon = (x: number) => (x / n) * 360 - 180
    const tileLat = (y: number) =>
      Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / n)) / rad
    const out: {
      key: string
      url: string
      x: number
      y: number
      w: number
      h: number
    }[] = []
    const x0 = tx(lonAt(vx))
    const x1 = tx(lonAt(vx + vw))
    const y0 = ty(latAt(vy))
    const y1 = ty(latAt(vy + vh))
    for (let X = x0; X <= x1 && out.length < 120; X++)
      for (let Y = y0; Y <= y1 && out.length < 120; Y++) {
        const west = tileLon(X)
        const east = tileLon(X + 1)
        const north = tileLat(Y)
        const south = tileLat(Y + 1)
        out.push({
          key: `${z}/${X}/${Y}`,
          url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${Y}/${X}`,
          x: (west - origin.lon0) * origin.mPerLon - 0.3,
          y: (origin.lat1 - north) * origin.mPerLat - 0.3,
          w: (east - west) * origin.mPerLon + 0.6,
          h: (north - south) * origin.mPerLat + 0.6
        })
      }
    return out
  }, [sat, data, mpp, vx, vy, vw, vh, size.w])

  // Flat terrain under the Standard view: lawns, water, pitches and roads.
  useEffect(() => {
    if (!sat && !terrain) loadTerrain().then(setTerrain)
  }, [sat, terrain])
  const terrainPaths = useMemo(
    () =>
      terrain && {
        green: ringsPath(terrain.green),
        pitch: ringsPath(terrain.pitch),
        water: ringsPath(terrain.water),
        streams: linesPath(terrain.streams),
        major: linesPath(terrain.roads.major),
        minor: linesPath(terrain.roads.minor),
        path: linesPath(terrain.roads.path)
      },
    [terrain]
  )

  // Levels a student can switch to (those with an indoor building).
  const levels = data.levels
    .filter((l) => levelSet.has(l.z))
    .sort((a, b) => b.z - a.z)

  const toP = (lon: number, lat: number) => project(data.origin, lon, lat)

  return (
    <div
      ref={box}
      className={cn(
        "relative touch-none overflow-hidden select-none",
        sat ? "bg-neutral-900" : "bg-muted/50",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}>
      <style>{`
        @keyframes marker-ping { 0% { transform: scale(0.6); opacity: 0.45; } 100% { transform: scale(1.1); opacity: 0; } }
        .marker-ping { animation: marker-ping 1.6s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes route-march { to { stroke-dashoffset: -${24}; } }
        .route-march { animation: route-march 0.9s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .route-march, .marker-ping { animation: none; } .marker-ping { opacity: 0.25; } }
      `}</style>

      <svg
        width={size.w}
        height={size.h}
        viewBox={measured ? `${vx} ${vy} ${vw} ${vh}` : "0 0 1 1"}
        className="block"
        role="img"
        aria-label="Campus map">
        {/* Flat terrain under the Standard view. */}
        {!sat && terrainPaths && (
          <g
            className="pointer-events-none"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path
              d={terrainPaths.green}
              fillRule="evenodd"
              className="fill-emerald-500/20"
            />
            <path
              d={terrainPaths.water}
              fillRule="evenodd"
              className="fill-sky-500/25"
            />
            <path
              d={terrainPaths.pitch}
              fillRule="evenodd"
              className="fill-emerald-500/25"
            />
            <path
              d={terrainPaths.streams}
              fill="none"
              strokeWidth={2}
              className="stroke-sky-500/40"
            />
            {/* Opaque strokes under one group opacity, so crossings do not darken. */}
            <g fill="none" opacity={0.13} className="stroke-foreground">
              <path d={terrainPaths.minor} strokeWidth={5} />
              <path d={terrainPaths.major} strokeWidth={9} />
            </g>
            <path
              d={terrainPaths.path}
              fill="none"
              strokeWidth={1.6}
              className="stroke-foreground/25"
            />
          </g>
        )}

        {/* Satellite imagery under everything else. */}
        {/* Daytime photos, dimmed in dark mode so the map matches the night theme. */}
        <g className="dark:[filter:brightness(0.7)_saturate(0.8)]">
          {tiles.map((t) => (
            <image
              key={t.key}
              href={t.url}
              x={t.x}
              y={t.y}
              width={t.w}
              height={t.h}
              preserveAspectRatio="none"
            />
          ))}
        </g>

        {/* Building footprints. In a level view, buildings with a floor plan are replaced by it. */}
        <g strokeLinejoin="round">
          {buildings.map((b) => {
            if (!inView(b.bounds)) return null
            const hasPlan = level !== null && hasFloor.has(b.id) && chunks[b.id]
            if (hasPlan) return null
            const ghost =
              level !== null && b.indoor && !b.levels.includes(level)
            return (
              <path
                key={b.id}
                d={b.d}
                fillRule="evenodd"
                strokeWidth={marker?.building === b.id ? 2.5 : 1}
                vectorEffect="non-scaling-stroke"
                onClick={() => onPick?.(`b:${b.id}`)}
                className={cn(
                  onPick && "cursor-pointer",
                  marker?.building === b.id
                    ? "fill-[hsl(var(--index-prj-border)/0.16)] stroke-[hsl(var(--index-prj-border))]"
                    : activeBuildings.has(b.id)
                      ? sat
                        ? hybridTone !== "grey" &&
                          hybridTone !== "darkgrey" &&
                          boxes
                          ? "fill-primary/60 stroke-white"
                          : "fill-primary/30 stroke-white"
                        : "fill-primary/20 stroke-primary/60"
                      : sat
                        ? boxes
                          ? HYBRID_FILL[hybridTone]
                          : "fill-transparent stroke-transparent"
                        : "fill-foreground/[0.06] stroke-foreground/15",
                  ghost && "opacity-40"
                )}>
                <title>{b.name}</title>
              </path>
            )
          })}
        </g>

        {/* Floor plans for the chosen level. */}
        {floors.map((f) =>
          inView(f.bounds) ? (
            <g key={f.id} strokeLinejoin="round">
              <path
                d={f.outline}
                fillRule="evenodd"
                className="fill-card stroke-foreground/40"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
              />
              <path d={f.halls} fillRule="evenodd" className="fill-muted" />
              <path
                d={f.other}
                fillRule="evenodd"
                className="fill-foreground/[0.06] stroke-foreground/20"
                strokeWidth={0.7}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={f.teaching}
                fillRule="evenodd"
                className="fill-foreground/[0.12] stroke-foreground/35"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={f.stairs}
                fillRule="evenodd"
                className="fill-foreground/30"
              />
              <path
                d={f.lifts}
                fillRule="evenodd"
                className="fill-primary/40"
              />
              {f.venueRooms.map(({ room, d }) => (
                <path
                  key={room.i}
                  d={d}
                  fillRule="evenodd"
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                  onClick={() => onPick?.(`v:${room.v}`)}
                  className={cn(
                    "cursor-pointer",
                    marker?.venue === room.v
                      ? "fill-[hsl(var(--index-prj-border)/0.3)] stroke-[hsl(var(--index-prj-border))]"
                      : "fill-primary/30 stroke-primary"
                  )}>
                  <title>{`${room.v}: ${room.n ?? room.c ?? ""}`}</title>
                </path>
              ))}
              {roomLabels && mpp < 0.3 && (
                <RoomLabels
                  rooms={f.labelled}
                  mpp={mpp}
                  view={[vx, vy, vw, vh]}
                />
              )}
            </g>
          ) : null
        )}

        {/* Landmark markers. */}
        {data.landmarks.map((l) => {
          if (!cats.has(l.c)) return null
          // Zoomed out, only halls (the anchors) get a marker.
          if (mpp >= 0.9 && l.c !== "hall") return null
          if (
            l.x < vx - 20 ||
            l.x > vx + vw + 20 ||
            l.y < vy - 20 ||
            l.y > vy + vh + 20
          )
            return null
          const indoorElsewhere =
            level !== null && l.b !== null && l.z !== level
          if (indoorElsewhere) return null
          return (
            <g
              key={l.id}
              transform={`translate(${l.x} ${l.y}) scale(${px})`}
              className={onPick ? "cursor-pointer" : undefined}
              onClick={() => onPick?.(`l:${l.id}`)}>
              <circle r={10} fill="transparent" />
              {l.c === "hall" ? (
                <rect
                  x={-4}
                  y={-4}
                  width={8}
                  height={8}
                  rx={2}
                  className="fill-muted-foreground stroke-background"
                  strokeWidth={1.5}>
                  <title>{l.n}</title>
                </rect>
              ) : (
                <circle
                  r={3}
                  className="fill-muted-foreground/70 stroke-background"
                  strokeWidth={1.2}>
                  <title>{l.n}</title>
                </circle>
              )}
            </g>
          )
        })}

        {/* Search results and category picks. */}
        {!crowded &&
          highlights?.map((h) => {
            if (h.id === selectedId) return null
            if (level !== null && h.z !== 0 && h.z !== level) return null
            if (
              h.x < vx - 20 ||
              h.x > vx + vw + 20 ||
              h.y < vy - 20 ||
              h.y > vy + vh + 20
            )
              return null
            return (
              <g
                key={h.id}
                transform={`translate(${h.x} ${h.y}) scale(${px})`}
                className="cursor-pointer"
                onClick={() => onPick?.(h.id)}>
                <circle
                  r={13}
                  className="fill-primary stroke-background"
                  strokeWidth={2.5}
                />
                <PlaceIcon
                  name={h.icon}
                  x={-7}
                  y={-7}
                  width={14}
                  height={14}
                  className="stroke-primary-foreground"
                  strokeWidth={2.2}
                />
                <title>{h.label}</title>
              </g>
            )
          })}

        {/* Routes. */}
        {routes.map((r) => (
          <RouteLines key={r.id} route={r} level={level} toP={toP} px={px} />
        ))}

        {/* The place being looked at: a red badge, or an outline when it is a whole building. */}
        {marker &&
          !marker.building &&
          (level === null || marker.z === level || marker.z === 0) && (
            <g
              transform={`translate(${marker.x} ${marker.y}) scale(${px})`}
              className="pointer-events-none">
              <circle
                r={24}
                style={{ fill: SELECTED }}
                className="marker-ping"
              />
              <circle
                r={15}
                style={{ fill: SELECTED }}
                className="stroke-background"
                strokeWidth={2.5}
              />
              <PlaceIcon
                name={marker.icon}
                x={-8}
                y={-8}
                width={16}
                height={16}
                className="stroke-white"
                strokeWidth={2.2}
              />
            </g>
          )}

        {/* Stop pins. */}
        {pins.map((p) => {
          const dim = level !== null && p.z !== level
          const text = p.numbers.join(",")
          const w = Math.max(24, text.length * 8 + 12)
          const sel = selectedPin === p.id
          return (
            <g
              key={p.id}
              transform={`translate(${p.x} ${p.y}) scale(${px})`}
              className={cn("cursor-pointer", dim && "opacity-35")}
              onClick={() => onPin(p.id)}>
              {sel && <circle r={w / 2 + 6} className="fill-primary/20" />}
              <rect
                x={-w / 2}
                y={-12}
                width={w}
                height={24}
                rx={12}
                className="fill-background"
                style={{ stroke: p.colour }}
                strokeWidth={3}
                strokeDasharray={p.approx ? "4 3" : undefined}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground text-[12px] font-bold">
                {text}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Labels sit in screen space so they stay crisp and a fixed size. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden text-[11px] leading-none">
        {labels.map((c) => (
          <span
            key={c.key}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 font-medium whitespace-nowrap",
              sat
                ? "[text-shadow:0_0_3px_rgb(0_0_0/0.9),0_0_6px_rgb(0_0_0/0.7)]"
                : "[text-shadow:0_0_3px_hsl(var(--background)),0_0_3px_hsl(var(--background)),0_0_6px_hsl(var(--background))]",
              sat
                ? c.muted
                  ? "text-white/85"
                  : "text-white"
                : c.muted
                  ? "text-muted-foreground"
                  : "text-foreground",
              c.cls
            )}
            style={{ left: c.x, top: c.y }}>
            {c.text}
          </span>
        ))}
      </div>

      <p
        className={cn(
          "pointer-events-none absolute text-[10px]",
          sat
            ? "text-white/85 [text-shadow:0_0_3px_rgb(0_0_0/0.9)]"
            : "text-muted-foreground"
        )}
        style={{ left: 12 + insets.left, bottom: 1 }}>
        {sat
          ? "Imagery © Esri, Maxar, Earthstar Geographics"
          : "Roads and greenery © OpenStreetMap contributors"}
      </p>

      {/* Top right: label filter, then the level picker. */}
      <div
        data-ui
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-3 flex flex-col items-end gap-2"
        style={{ top: 12 + insets.top }}>
        {extraControls}
        <MapMenu
          title="Level"
          open={levelsOpen}
          onOpenChange={setLevelsOpen}
          className="max-h-[60vh] w-auto min-w-40 overflow-y-auto p-1"
          trigger={
            <button
              type="button"
              aria-label="Choose a level"
              className={cn(
                FLOATING,
                "flex h-11 w-[84px] cursor-pointer items-center justify-center gap-2 px-3 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.97]"
              )}>
              <StairsIcon />
              <span className="min-w-5 text-center tabular-nums">
                {level === null ? "All" : levelShort(data, level)}
              </span>
            </button>
          }>
          <LevelOption
            active={level === null}
            onClick={() => {
              onLevel(null)
              setLevelsOpen(false)
            }}
            title="All"
            hint="Campus view"
          />
          {levels.map((l) => (
            <LevelOption
              key={l.z}
              active={level === l.z}
              onClick={() => {
                onLevel(l.z)
                setLevelsOpen(false)
              }}
              title={levelShort(data, l.z)}
              hint={levelLabel(data, l.z)}
            />
          ))}
        </MapMenu>
        {onFullscreen && (
          <div className={cn(FLOATING, "relative", intro && "z-[100]")}>
            <MapButton
              label={fullscreen ? "Exit full screen" : "Full screen"}
              onClick={onFullscreen}>
              {fullscreen ? <Minimize2 /> : <Maximize2 />}
            </MapButton>
            {intro && (
              <div className="bg-card absolute top-1/2 right-full mr-3 w-56 -translate-y-1/2 rounded-xl border p-3 text-sm shadow-lg">
                <p className="font-semibold">Use the whole screen</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  Tap this button for a bigger map. Tap it again to come back.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom right: zoom, frame and fullscreen. Sits above any bottom sheet,
          but never climbs into the level button at the top right. */}
      <div
        data-ui
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "absolute right-3 flex flex-col gap-2 transition-[bottom,opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          // Resizing: do not slide, but let the stack fade in with the menus.
          snap &&
            "[transition-property:opacity,transform] delay-300 duration-1000",
          !stackFits(size.h) && "pointer-events-none translate-y-2 opacity-0"
        )}
        style={{ bottom: 12 + insets.bottom }}>
        <div className={cn(FLOATING, "flex flex-col overflow-hidden")}>
          <MapButton label="Zoom in" onClick={() => zoomBy(0.6)}>
            <Plus />
          </MapButton>
          <span className="bg-border mx-2 h-px" />
          <MapButton label="Zoom out" onClick={() => zoomBy(1.6)}>
            <Minus />
          </MapButton>
        </div>
        {
          <div className={cn(FLOATING, "overflow-hidden")}>
            <MapButton
              label="Fit the chosen place, route or campus"
              onClick={() => {
                const pts = pins.map((p) => [p.x, p.y])
                if (focus) fit(focus.bounds)
                else if (pts.length)
                  fit([
                    Math.min(...pts.map((p) => p[0])),
                    Math.min(...pts.map((p) => p[1])),
                    Math.max(...pts.map((p) => p[0])),
                    Math.max(...pts.map((p) => p[1]))
                  ])
                else fit([0, 0, data.size.width, data.size.height], 10)
              }}>
              <LocateFixed />
            </MapButton>
          </div>
        }
        {onHelp && (
          <div className={cn(FLOATING, "overflow-hidden")}>
            <MapButton label="How to use the map" onClick={onHelp}>
              <CircleHelp />
            </MapButton>
          </div>
        )}
      </div>
      {intro && (
        // Swallow input: React events bubble to the map, which would pan under it.
        <div
          className="fixed inset-0 z-[90] touch-none overscroll-none bg-black/65"
          aria-hidden="true"
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {level !== null && (
        <div
          data-ui
          className={cn(
            FLOATING,
            "text-muted-foreground absolute flex h-[42px] items-center gap-3 px-3 text-xs transition-[bottom] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            snap && "transition-none"
          )}
          style={{ left: 12 + insets.left, bottom: 12 + insets.bottom }}>
          <span className="text-foreground font-semibold">
            {levelLabel(data, level)}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="bg-foreground/30 inline-block size-2.5 rounded-sm" />
            Stairs
          </span>
          <span className="flex items-center gap-1.5">
            <i className="bg-primary/50 inline-block size-2.5 rounded-sm" />
            Lift
          </span>
        </div>
      )}
    </div>
  )
}

/** One look for every control floating over the map: translucent, not heavy. */
export const FLOATING = "bg-card border rounded-xl shadow-sm"

const MapButton = ({
  label,
  onClick,
  children
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="hover:bg-accent flex size-10 cursor-pointer items-center justify-center transition-[background-color,transform] duration-150 ease-out active:scale-[0.94] [&_svg]:size-4">
    {children}
  </button>
)

const StairsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden>
    <path d="M3 20h5v-5h5v-5h5V5h3" />
  </svg>
)

const LevelOption = ({
  active,
  onClick,
  title,
  hint
}: {
  active: boolean
  onClick: () => void
  title: string
  hint?: string
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "flex w-full cursor-pointer items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors max-lg:py-3",
      active
        ? "bg-primary text-primary-foreground"
        : "hover:bg-accent text-foreground"
    )}>
    <span className="font-medium">{title}</span>
    {hint && (
      <span
        className={cn(
          "text-xs",
          active ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
        {hint}
      </span>
    )}
  </button>
)

const RoomLabels = ({
  rooms,
  mpp,
  view
}: {
  rooms: Room[]
  mpp: number
  view: [number, number, number, number]
}) => (
  <g
    className="fill-foreground/80 pointer-events-none"
    textAnchor="middle"
    dominantBaseline="central"
    fontSize={10 * mpp}>
    {rooms.map((r) => {
      const [x0, y0, x1, y1] = ringsBounds(r.r)
      if (
        x1 < view[0] ||
        x0 > view[0] + view[2] ||
        y1 < view[1] ||
        y0 > view[1] + view[3]
      )
        return null
      const text =
        r.v ??
        ((r.n ?? "").replace(/\s*\(.*?\)\s*$/, "") ||
          (r.c ?? "").replace(/^[A-Z0-9.]+-/, ""))
      if (!text || (x1 - x0) / mpp < text.length * 5 + 8) return null
      return (
        <text key={r.i} x={(x0 + x1) / 2} y={(y0 + y1) / 2}>
          {text.length > 22 ? text.slice(0, 21) + "…" : text}
        </text>
      )
    })}
  </g>
)

const RouteLines = ({
  route,
  level,
  toP,
  px
}: {
  route: RouteLayer
  level: number | null
  toP: (lon: number, lat: number) => [number, number]
  px: number
}) => {
  const colour = legColour[route.status]
  const lines = route.walk.segments.map((s) => {
    let d = ""
    for (let i = 0; i < s.pts.length; i += 2) {
      const [x, y] = toP(s.pts[i], s.pts[i + 1])
      d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    return { z: s.z, d }
  })
  return (
    <g
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="pointer-events-none">
      {lines.map((l, i) => {
        const here = level === null || l.z === level
        return (
          <g key={i} opacity={here ? 1 : 0.35}>
            <path
              d={l.d}
              className="stroke-background"
              strokeWidth={route.active ? 8 : 6}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={l.d}
              style={{ stroke: colour }}
              strokeWidth={route.active ? 4.5 : 3}
              strokeDasharray={here ? undefined : "2 7"}
              vectorEffect="non-scaling-stroke"
              opacity={route.active || route.id === "solo" ? 1 : 0.55}
            />
            {route.active && here && (
              <path
                d={l.d}
                className="route-march stroke-background/80"
                strokeWidth={1.6}
                strokeDasharray="2 10"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        )
      })}
      {route.walk.changes.map((c, i) => {
        if (level !== null && c.from !== level && c.to !== level) return null
        const [x, y] = toP(c.lon, c.lat)
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${px})`}>
            <circle
              r={9}
              className="fill-background"
              style={{ stroke: colour }}
              strokeWidth={2.5}
            />
            {/* The same glyphs as the steps in the directions list: stairs, or a lift. */}
            <g
              transform="scale(0.55) translate(-12 -12)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3.3}
              style={{ stroke: colour }}>
              {c.stairs ? (
                <path d="M3 20h5v-5h5v-5h5V5h3" />
              ) : (
                <path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" />
              )}
            </g>
          </g>
        )
      })}
    </g>
  )
}

export default CampusMap
