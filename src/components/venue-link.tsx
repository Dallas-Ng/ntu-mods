import { MapPin } from "lucide-react"

import { getVenueMapsUrl, isLinkableVenue } from "@/lib/get-venue-maps-url"
import { cn } from "@/lib/utils"

interface Props {
  venue: string
  className?: string
}

const VenueLink = ({ venue, className }: Props) => {
  if (!isLinkableVenue(venue)) return <>{venue}</>

  return (
    <a
      href={getVenueMapsUrl(venue)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Find ${venue} on Google Maps`}
      className={cn(
        "hover:text-foreground inline-flex items-center gap-0.5 underline decoration-dotted underline-offset-2",
        className
      )}>
      {venue}
      <MapPin className="size-3 shrink-0" />
    </a>
  )
}

export default VenueLink
