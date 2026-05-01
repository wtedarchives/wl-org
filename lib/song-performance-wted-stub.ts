import type { SetlistEntry } from "@/types/setlist"
import type { SongPerformance } from "@/types/song"

/**
 * Minimal {@link SetlistEntry} for {@link SetlistEntryWtedCell} and WTED request modal
 * when opening WTED from a song-detail performance row (no full setlist row payload).
 */
export function songPerformanceToWtedStubEntry(
  perf: SongPerformance,
  songCanonical: string,
  songDisplayName?: string | null,
): SetlistEntry {
  const setnum =
    typeof perf.entry_setnum === "number" ?
      perf.entry_setnum
    : parseInt(String(perf.entry_setnum), 10) || 0
  const songMeta = {
    song_id: "",
    song: songCanonical,
    song_displayname: songDisplayName ?? null,
    song_category: "",
    song_originalartist: null as string | null,
    categories: {
      category_canonid: 0,
      category_artwork: null as string | null,
    },
  }
  return {
    entry_id: perf.entry_id ?? "",
    entry_set: perf.entry_set ?? "",
    entry_setnum: setnum,
    entry_song: perf.entry_song ?? songCanonical,
    entry_short: perf.entry_short,
    entry_segue: perf.entry_segue,
    entry_length: perf.entry_length,
    entry_placement: perf.entry_placement ?? "",
    entry_coachnotes: perf.entry_coachnotes,
    entry_setorder: 0,
    entry_show: perf.show_id,
    radio_id: perf.radio_id ?? null,
    song_tour_count: null,
    last_count: null,
    song_id: "",
    last_show_id: null,
    last_show_tour: null,
    last_show_subvenue: null,
    last_venue: null,
    last_venue_location: null,
    last_show_date: null,
    times_played: null,
    shows_since_debut: null,
    song_rarity_percentage: null,
    times_played_num: perf.shows_since_debut_num ?? null,
    shows_since_debut_num: perf.shows_since_debut_num ?? null,
    guests: perf.guests ?? [],
    song_category: "",
    category_canonid: 0,
    joty_round: perf.joty_round ?? null,
    songs: songMeta,
  }
}
