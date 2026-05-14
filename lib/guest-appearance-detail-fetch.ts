/** Matches {@link SongWithGuest} from `use-guest-appearances` (kept here to avoid hook↔lib cycle). */
export interface GuestAppearanceSongRow {
  entry_song: string
  song_displayname?: string | null
  show_date: string
  show_id: string
  show_venue_location: string
  entry_length: string | null
  entry_short: string | null
  entry_segue: string | null
}

/** One row per show (profile personnel modal: attended shows where the guest appeared). */
export interface GuestPersonnelShowRow {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string
  show_tour: string | null
  venue_id: string | null
  show_subvenue_venue: string | null
  tour_id: string | null
}

type NestedSubvenues =
  | { venues?: { venue_id?: string | null } | null }
  | Array<{ venues?: { venue_id?: string | null } | null }>
  | null
  | undefined

type SetlistEntryWithGuestShow = {
  entry_show: string
  shows?:
    | {
        show_id?: string
        show_date?: string
        show_subvenue?: string
        show_venue_location?: string
        show_tour?: string | null
        show_canonid?: number | null
        show_subvenue_venue?: string | null
        subvenues?: NestedSubvenues
        tours?: { tour_id?: string } | Array<{ tour_id?: string }> | null
      }
    | Array<{
        show_id?: string
        show_date?: string
        show_subvenue?: string
        show_venue_location?: string
        show_tour?: string | null
        show_canonid?: number | null
        show_subvenue_venue?: string | null
        subvenues?: NestedSubvenues
        tours?: { tour_id?: string } | Array<{ tour_id?: string }> | null
      }>
}

function venueIdFromSubvenues(subvenues: NestedSubvenues): string | null {
  if (!subvenues) return null
  const pack = Array.isArray(subvenues) ? subvenues[0] : subvenues
  const id = pack?.venues?.venue_id
  if (id == null || String(id).trim() === "") return null
  return String(id)
}

function tourIdFromNested(
  tours:
    | { tour_id?: string }
    | Array<{ tour_id?: string }>
    | null
    | undefined,
): string | null {
  if (!tours) return null
  const row = Array.isArray(tours) ? tours[0] : tours
  const id = row?.tour_id
  if (id == null || String(id).trim() === "") return null
  return String(id)
}

/**
 * Distinct attended shows where `guestId` appears on the setlist (any entry).
 * Sorted by `show_canonid` ascending.
 */
export async function fetchGuestAppearanceShowsForShows(
  guestId: string,
  showIds: string[],
): Promise<GuestPersonnelShowRow[]> {
  if (!showIds.length) return []

  const { supabase } = await import("@/lib/supabase")
  if (!supabase) return []

  const { data, error } = await supabase
    .from("setlist_entries")
    .select(
      `
          entry_show,
          setlist_entry_guests!inner (
            guest_id
          ),
          shows (
            show_id,
            show_date,
            show_subvenue,
            show_venue_location,
            show_tour,
            show_canonid,
            show_subvenue_venue,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            tours(
              tour_id
            )
          )
        `,
    )
    .in("entry_show", showIds)
    .eq("setlist_entry_guests.guest_id", guestId)

  if (error) throw error

  const byShowId = new Map<
    string,
    GuestPersonnelShowRow & { _canon: number }
  >()

  for (const entry of (data ?? []) as SetlistEntryWithGuestShow[]) {
    const show = Array.isArray(entry.shows) ? entry.shows[0] : entry.shows
    const sid = show?.show_id ?? entry.entry_show
    if (!sid || byShowId.has(sid)) continue
    byShowId.set(sid, {
      show_id: sid,
      show_date: show?.show_date ?? "",
      show_subvenue: show?.show_subvenue ?? "",
      show_venue_location: show?.show_venue_location ?? "",
      show_tour: show?.show_tour ?? null,
      venue_id: venueIdFromSubvenues(show?.subvenues),
      show_subvenue_venue:
        show?.show_subvenue_venue != null &&
        String(show.show_subvenue_venue).trim() !== "" ?
          String(show.show_subvenue_venue)
        : null,
      tour_id: tourIdFromNested(show?.tours),
      _canon: show?.show_canonid ?? 0,
    })
  }

  return [...byShowId.values()]
    .sort((a, b) => a._canon - b._canon)
    .map(({ _canon: _c, ...row }) => row)
}

/**
 * Guest drill-down rows for {@link WlHomeV2GuestAppearancesModal} / {@link GuestAppearancesDetailTable}.
 * Same query shape as tour guest appearances, scoped to arbitrary show ids (e.g. user attended shows).
 */
export async function fetchGuestAppearanceSongsForShows(
  guestId: string,
  showIds: string[],
): Promise<GuestAppearanceSongRow[]> {
  if (!showIds.length) return []

  const { supabase } = await import("@/lib/supabase")
  if (!supabase) return []

  const { data, error } = await supabase
    .from("setlist_entries")
    .select(
      `
          entry_song,
          entry_length,
          entry_short,
          entry_segue,
          entry_show,
          entry_set,
          entry_setnum,
          songs:entry_song(song_displayname),
          setlist_entry_guests!inner (
            guest_id
          ),
          shows (
            show_date,
            show_venue_location,
            show_canonid
          )
        `,
    )
    .in("entry_show", showIds)
    .eq("setlist_entry_guests.guest_id", guestId)
    .order("shows(show_canonid)", { ascending: true })
    .order("entry_set", { ascending: true })
    .order("entry_setnum", { ascending: true })

  if (error) throw error

  return ((data ?? []) as Array<{
    entry_song: string
    entry_length: string | null
    entry_short: string | null
    entry_segue: string | null
    entry_show: string
    songs?:
      | { song_displayname?: string | null }
      | Array<{ song_displayname?: string | null }>
    shows?:
      | { show_date?: string; show_venue_location?: string }
      | Array<{ show_date?: string; show_venue_location?: string }>
  }>).map((entry) => {
    const show = Array.isArray(entry.shows) ? entry.shows[0] : entry.shows
    const songsRel = entry.songs
    const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
    return {
      entry_song: entry.entry_song,
      song_displayname: songRow?.song_displayname ?? null,
      show_date: show?.show_date ?? "",
      show_id: entry.entry_show,
      show_venue_location: show?.show_venue_location ?? "",
      entry_length: entry.entry_length,
      entry_short: entry.entry_short,
      entry_segue: entry.entry_segue,
    }
  })
}

export async function fetchGuestInstrumentFromDb(
  guestId: string,
): Promise<string | null> {
  const { supabase } = await import("@/lib/supabase")
  if (!supabase) return null

  const { data } = await supabase
    .from("guests")
    .select("guest_instrument")
    .eq("guest_id", guestId)
    .single()

  const row = data as { guest_instrument?: string | null } | null
  return row?.guest_instrument ?? null
}
