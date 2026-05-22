import type { SupabaseClient } from "@supabase/supabase-js"

import type { SongPerformance } from "@/hooks/use-song-tour-performances"
import type { Guest } from "@/types/setlist"

export async function fetchSongTourPerformances(
  client: SupabaseClient,
  songName: string,
  tourName: string,
): Promise<SongPerformance[]> {
  const { data, error: dbError } = await client
    .from("setlist_entries")
    .select(
      `
      entry_id,
      entry_set,
      entry_setnum,
      entry_song,
      entry_short,
      entry_segue,
      entry_length,
      entry_placement,
      entry_coachnotes,
      entry_show,
      shows!inner(
        show_id,
        show_date,
        show_canonid,
        show_tour,
        show_subvenue,
        show_venue_location,
        show_subvenue_venue,
        subvenues:show_subvenue(
          venues:subvenue_venue(
            venue_id
          )
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
      )
    `,
    )
    .eq("entry_song", songName)
    .eq("shows.show_tour", tourName)

  if (dbError) throw dbError

  const rows = (data ?? []) as Record<string, unknown>[]

  const mapped = rows.map((row) => {
    const showsRel = row.shows as
      | {
          show_id: string
          show_date: string
          show_canonid?: number | null
          show_subvenue: string
          show_venue_location: string
          show_subvenue_venue?: string | null
          subvenues?: { venues?: { venue_id: string } } | null
        }
      | {
          show_id: string
          show_date: string
          show_canonid?: number | null
          show_subvenue: string
          show_venue_location: string
          show_subvenue_venue?: string | null
          subvenues?: { venues?: { venue_id: string } } | null
        }[]
      | undefined

    const show =
      Array.isArray(showsRel) && showsRel.length > 0 ?
        showsRel[0]
      : (showsRel as
          | {
              show_id: string
              show_date: string
              show_canonid?: number | null
              show_subvenue: string
              show_venue_location: string
              show_subvenue_venue?: string | null
              subvenues?: { venues?: { venue_id: string } } | null
            }
          | undefined)
    const subvenuesVal = show?.subvenues
    const venueId =
      (Array.isArray(subvenuesVal) ?
        subvenuesVal[0]?.venues?.venue_id
      : (subvenuesVal as { venues?: { venue_id: string } } | undefined)?.venues
          ?.venue_id) ?? null

    const guestsRaw = row.setlist_entry_guests as
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

    const guests: Guest[] =
      guestsRaw
        ?.map((g) => ({
          guest_id: g.guest_id,
          guest_display_name: g.guests.guest_displayname,
          guest_canonid: g.guests.guest_canonid,
          guest_instrument: g.guests.guest_instrument,
          guest_category: g.guests.guest_category ?? null,
        }))
        .sort((a, b) => a.guest_canonid - b.guest_canonid) ?? []

    return {
      entry_id: row.entry_id as string,
      entry_set: row.entry_set as string,
      entry_setnum: Number(row.entry_setnum),
      entry_placement: (row.entry_placement as string) ?? "",
      entry_song: row.entry_song as string,
      entry_short: (row.entry_short as string | null) ?? null,
      entry_segue: (row.entry_segue as string | null) ?? null,
      entry_length: (row.entry_length as string | null) ?? null,
      entry_coachnotes: (row.entry_coachnotes as string | null) ?? null,
      show_id: show?.show_id ?? (row.entry_show as string),
      show_date: show?.show_date ?? "",
      show_canonid: show?.show_canonid ?? null,
      show_subvenue: show?.show_subvenue ?? "",
      show_venue_location: show?.show_venue_location ?? "",
      show_subvenue_venue: show?.show_subvenue_venue ?? null,
      venue_id: venueId,
      guests,
    }
  }) as SongPerformance[]

  mapped.sort((a, b) => {
    if (a.show_date !== b.show_date) return a.show_date.localeCompare(b.show_date)
    const canonA = a.show_canonid ?? 999999
    const canonB = b.show_canonid ?? 999999
    if (canonA !== canonB) return canonA - canonB
    if (a.entry_set !== b.entry_set) return a.entry_set.localeCompare(b.entry_set)
    return a.entry_setnum - b.entry_setnum
  })

  return mapped
}
