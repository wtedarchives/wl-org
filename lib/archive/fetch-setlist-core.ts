import { supabase } from "@/lib/supabase"
import {
  mapSupabaseSetlistRowToEntry,
  SETLIST_ENTRY_DETAIL_SELECT,
} from "@/lib/map-supabase-setlist-entry-row"
import type { Show, SetlistEntry } from "@/types/setlist"

export interface SetlistCoreData {
  show: Show
  setlist: SetlistEntry[]
}

export async function fetchSetlistCore(
  showId: string,
): Promise<SetlistCoreData> {
  if (!supabase) {
    throw new Error("Supabase client is not configured")
  }

  const client = supabase

  const { data: showData, error: showError } = await client
    .from("shows")
    .select(
      `
            show_id,
            show_date,
            show_group,
            show_tour,
            show_subvenue,
            show_venue_location,
            show_detail,
            show_alert,
            show_coachnotes,
            show_canonid,
            show_callbacks,
            show_wl_link,
            show_subvenue_venue,
            rating_visibility,
            show_rarity,
            show_gap,
            show_length,
            show_listcategorycomplete,
            show_jivecomplete,
            show_dripfieldcomplete,
            discography_display,
            egn_sourced,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            tours!inner(tour_showfields, tour_id)
          `,
    )
    .eq("show_id", showId)
    .single()

  if (showError) throw showError

  const toursRaw = showData?.tours as
    | { tour_showfields: boolean; tour_id: string }
    | { tour_showfields: boolean; tour_id: string }[]
    | undefined
  const tourRow = Array.isArray(toursRaw) ? toursRaw[0] : toursRaw
  const subvenuesRow = showData?.subvenues as
    | { venues?: { venue_id: string } }
    | undefined

  const show = {
    ...showData,
    show_tour: showData.show_tour ?? null,
    tour_showfields: tourRow?.tour_showfields ?? false,
    show_callbacks: showData.show_callbacks ?? null,
    tour_id: tourRow?.tour_id ?? "",
    venue_id: subvenuesRow?.venues?.venue_id ?? undefined,
  } as Show

  const { data: setlistData, error: setlistError } = await client
    .from("setlist_entries")
    .select(SETLIST_ENTRY_DETAIL_SELECT)
    .eq("entry_show", showId)
    .order("entry_set", { ascending: true })
    .order("entry_setnum", { ascending: true })

  if (setlistError) throw setlistError

  const setlist = (setlistData ?? []).map((entry: Record<string, unknown>) =>
    mapSupabaseSetlistRowToEntry(entry),
  )

  return { show, setlist }
}
