import {
  Building2,
  BusFront,
  DoorOpen,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  House,
  Library,
  Presentation,
  SquareParking,
  Store,
  Toilet,
  Utensils,
  type LucideIcon,
  type LucideProps
} from "lucide-react"

/** One icon per kind of place, shared by the chips, lists and map badges. */
export const PLACE_ICON: Record<string, LucideIcon> = {
  hall: House,
  food: Utensils,
  transport: BusFront,
  study: Library,
  sports: Dumbbell,
  exam: GraduationCap,
  services: Store,
  parking: SquareParking,
  toilet: Toilet,
  aed: HeartPulse,
  lt: Presentation,
  building: Building2,
  venue: DoorOpen
}

export const iconFor = (key: string): LucideIcon => PLACE_ICON[key] ?? Building2

/** An icon by key, for lists, chips and inside the map's SVG. */
export const PlaceIcon = ({
  name,
  ...props
}: { name: string } & LucideProps) => {
  const Icon = PLACE_ICON[name] ?? Building2
  return <Icon {...props} />
}
