/**
 * NTU doesn't publish a venue-to-coordinate dataset, so we point to a Google
 * Maps search rather than a pinned location — accurate enough for freshers
 * to find a lecture hall without us guessing at coordinates.
 */
export const getVenueMapsUrl = (venue: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`NTU ${venue}`)}`

/**
 * Venue strings can be empty (online classes), "Online"/"ONLINE", or a
 * comma-joined list of multiple rooms (variations across groups) — none of
 * these resolve to a single sensible map query.
 */
export const isLinkableVenue = (venue: string) =>
  venue.trim().length > 0 &&
  !venue.includes(",") &&
  !/online|multiple venues/i.test(venue)
