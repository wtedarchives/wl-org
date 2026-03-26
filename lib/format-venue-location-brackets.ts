/** True when `venue` (trimmed) already has `[` or `]` at the start or end. */
export function venueLocationAlreadyBracketed(venue: string): boolean {
  const t = venue.trim()
  if (!t) return false
  return (
    t.startsWith("[") ||
    t.startsWith("]") ||
    t.endsWith("[") ||
    t.endsWith("]")
  )
}

/**
 * Wraps venue/location in [brackets] for compact tour card rows when the source
 * string is plain text. Skips wrapping when the value already has [ or ] at an
 * edge (e.g. "[Unknown], City" from combined subvenue/venue fields).
 */
export function formatVenueLocationWithBrackets(venue: string): string {
  const t = venue.trim()
  if (venueLocationAlreadyBracketed(venue)) {
    return t
  }
  return `[${t}]`
}
