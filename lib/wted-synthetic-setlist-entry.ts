import type { WtedRadioIdRow } from "@/lib/wted-radio-ids-sync"
import type { SetlistEntry } from "@/types/setlist"

/** Stable fake show id so `getWtedEntriesForRadioGroup` only groups home-request rows with themselves. */
export const HOME_WTED_SYNTHETIC_SHOW_ID =
  "00000000-0000-4000-8000-000000000001"

/**
 * Minimal `SetlistEntry` for opening `SetlistWtedSheet` from the home catalog.
 * Artwork resolves via `radio_id` → `wted_radio_ids.artwork` (same as the drawer hook).
 */
export function setlistEntryFromWtedRadioRow(row: WtedRadioIdRow): SetlistEntry {
  const title = row.track_title?.trim() || "Unknown track"
  const songId = `home-song-${row.uuid}`
  const entryId = `home-entry-${row.uuid}`
  return {
    entry_id: entryId,
    entry_set: "1",
    entry_setnum: 1,
    entry_song: title,
    entry_short: null,
    entry_segue: null,
    entry_length: null,
    entry_placement: "",
    entry_coachnotes: null,
    entry_setorder: 1,
    entry_show: HOME_WTED_SYNTHETIC_SHOW_ID,
    radio_id: row.radio_id,
    song_tour_count: null,
    last_count: null,
    song_id: songId,
    last_show_id: null,
    last_show_tour: null,
    last_show_subvenue: null,
    last_venue: null,
    last_venue_location: null,
    last_show_date: null,
    times_played: null,
    shows_since_debut: null,
    song_rarity_percentage: null,
    times_played_num: null,
    shows_since_debut_num: null,
    guests: [],
    song_category: "",
    category_canonid: 0,
    joty_round: null,
    songs: {
      song_id: songId,
      song: title,
      song_displayname: title,
      song_category: "",
      song_originalartist: row.track_artist,
      categories: {
        category_canonid: 0,
        category_artwork: null,
      },
    },
  }
}
