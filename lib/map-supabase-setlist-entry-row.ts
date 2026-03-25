import type { SetlistEntry } from "@/types/setlist"

/** Maps a raw Supabase `setlist_entries` row (with nested joins) to `SetlistEntry`. */
export function mapSupabaseSetlistRowToEntry(
  entry: Record<string, unknown>,
): SetlistEntry {
  const songs = entry.songs as
    | {
        song_id: string
        song: string
        song_displayname: string | null
        song_category: string
        song_originalartist: string | null
        categories: { category_canonid: number }
      }
    | undefined
  const guestsRaw = entry.setlist_entry_guests as
    | Array<{
        guest_id: string
        guests: {
          guest_displayname: string
          guest_canonid: number
          guest_instrument: string
          guest_category?: string | null
        }
      }>
    | undefined
  const jotyResults = entry.joty_results as
    | { round_achieved: string | null }
    | undefined

  return {
    ...entry,
    song_id: songs?.song_id ?? "",
    song_category: songs?.song_category ?? "",
    category_canonid: songs?.categories?.category_canonid ?? 0,
    times_played_num:
      entry.times_played_num != null ? Number(entry.times_played_num) : null,
    shows_since_debut_num:
      entry.shows_since_debut_num != null
        ? Number(entry.shows_since_debut_num)
        : null,
    joty_round: jotyResults?.round_achieved ?? null,
    guests:
      guestsRaw?.map((g) => ({
        guest_id: g.guest_id,
        guest_display_name: g.guests.guest_displayname,
        guest_canonid: g.guests.guest_canonid,
        guest_instrument: g.guests.guest_instrument,
        guest_category: g.guests.guest_category ?? null,
      })) ?? [],
    songs: songs
      ? {
          ...songs,
          song: songs.song ?? "",
          song_displayname: songs.song_displayname ?? null,
          song_originalartist: songs.song_originalartist ?? null,
          categories: {
            category_canonid: songs.categories?.category_canonid ?? 0,
            category_artwork: null,
          },
        }
      : {
          song_id: "",
          song: "",
          song_displayname: null,
          song_category: "",
          song_originalartist: null,
          categories: { category_canonid: 0, category_artwork: null },
        },
  } as SetlistEntry
}

/** Select fragment for setlist_entries with nested song, guests, joty (matches useSetlistData). */
export const SETLIST_ENTRY_DETAIL_SELECT = `
  entry_id,
  entry_set,
  entry_setnum,
  entry_song,
  entry_short,
  entry_segue,
  entry_length,
  entry_placement,
  entry_coachnotes,
  entry_setorder,
  entry_show,
  radio_id,
  song_tour_count,
  last_count,
  last_show_id,
  last_show_tour,
  last_show_subvenue,
  last_venue,
  last_venue_location,
  last_show_date,
  times_played,
  shows_since_debut,
  song_rarity_percentage,
  times_played_num,
  shows_since_debut_num,
  songs (
    song_id,
    song,
    song_displayname,
    song_category,
    song_originalartist,
    categories (
      category_canonid
    )
  ),
  setlist_entry_guests(
    guest_id,
    guests(
      guest_displayname,
      guest_canonid,
      guest_instrument,
      guest_category
    )
  ),
  joty_results (
    round_achieved
  )
`
