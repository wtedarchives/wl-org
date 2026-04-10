import { SETLIST_ENTRY_DETAIL_SELECT } from "@/lib/map-supabase-setlist-entry-row"

const SETLIST_SELECT_WITH_CATEGORY_ARTWORK =
  SETLIST_ENTRY_DETAIL_SELECT.replace(
    `categories (
      category_canonid
    )`,
    `categories (
      category_canonid,
      category_artwork
    )`,
  )

/** `setlist_entries` shape for WTED episode rows: full setlist entry + source show/venue. */
export const WTED_EPISODE_SETLIST_ENTRY_SELECT = `
${SETLIST_SELECT_WITH_CATEGORY_ARTWORK.trim()},
shows (
  show_id,
  show_date,
  show_venue_location,
  show_group,
  subvenues:show_subvenue (
    venues:subvenue_venue (
      venue_id
    )
  )
)
`
