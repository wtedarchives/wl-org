import { supabase } from "@/lib/supabase"
import {
  mapSupabaseSetlistRowToEntry,
  SETLIST_ENTRY_DETAIL_SELECT,
} from "@/lib/map-supabase-setlist-entry-row"
import type { Show, SetlistEntry } from "@/types/setlist"
import type { ShowRelease } from "@/hooks/use-setlist-releases"

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
            show_issetlistgame,
            show_scored,
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

  // Attach linked Bandcamp tracks (separate query, like setlist_entry_media).
  const entryIds = setlist.map((e) => e.entry_id)
  if (entryIds.length > 0) {
    const { data: bandcampRows } = await client
      .from("bandcamp_tracks")
      .select("entry_id, track_id, album_id, track_link, track_title")
      .in("entry_id", entryIds)
    if (bandcampRows && bandcampRows.length > 0) {
      const byEntry = new Map<string, (typeof bandcampRows)[number]>()
      for (const row of bandcampRows) byEntry.set(row.entry_id as string, row)
      for (const entry of setlist) {
        const row = byEntry.get(entry.entry_id)
        entry.bandcampTrack = row
          ? {
              track_id: Number(row.track_id),
              album_id: Number(row.album_id),
              track_link: row.track_link as string,
              track_title: (row.track_title as string | null) ?? null,
            }
          : null
      }
    }
  }

  // Attach the chosen YouTube release per entry, in the same fetch as the setlist so the
  // Media column is fully determined on first paint (no pop-in). Priority: prefer a
  // display name other than "Full Show", then the lowest releases_shows.release_order;
  // fall back to a "Full Show" video if that's all a song has.
  if (entryIds.length > 0) {
    const { data: rsData } = await client
      .from("releases_shows")
      .select(
        "release_id, release_order, releases(release_id, release_displayname, release_artwork, release_link, release_service)",
      )
      .eq("show_id", showId)
      .order("release_order", { ascending: true })

    type RsRow = {
      release_id: string
      release_order: number | null
      releases:
        | {
            release_id: string
            release_displayname: string | null
            release_artwork: string | null
            release_link: string | null
            release_service: string | null
          }
        | {
            release_id: string
            release_displayname: string | null
            release_artwork: string | null
            release_link: string | null
            release_service: string | null
          }[]
        | null
    }
    const youtubeReleases: ShowRelease[] = ((rsData as RsRow[] | null) ?? [])
      .map((r): ShowRelease | null => {
        const rel = Array.isArray(r.releases) ? r.releases[0] : r.releases
        if (!rel) return null
        if ((rel.release_service ?? "").toLowerCase().trim() !== "youtube")
          return null
        if (!rel.release_link) return null
        return {
          release_id: rel.release_id,
          release_displayname: rel.release_displayname,
          release_artwork: rel.release_artwork,
          release_link: rel.release_link,
          release_service: rel.release_service,
          release_order: r.release_order,
        }
      })
      .filter((r): r is ShowRelease => r != null)

    if (youtubeReleases.length > 0) {
      const { data: semData } = await client
        .from("setlist_entry_media")
        .select("setlist_entry_id, release_id")
        .in(
          "release_id",
          youtubeReleases.map((r) => r.release_id),
        )
      const releaseById = new Map(youtubeReleases.map((r) => [r.release_id, r]))
      const byEntry = new Map<string, ShowRelease[]>()
      for (const row of (semData ?? []) as {
        setlist_entry_id: string
        release_id: string
      }[]) {
        const rel = releaseById.get(row.release_id)
        if (!rel) continue
        if (!byEntry.has(row.setlist_entry_id)) {
          byEntry.set(row.setlist_entry_id, [])
        }
        byEntry.get(row.setlist_entry_id)!.push(rel)
      }
      const isFullShow = (r: ShowRelease) =>
        (r.release_displayname ?? "").trim().toLowerCase() === "full show"
      for (const entry of setlist) {
        const list = byEntry.get(entry.entry_id)
        if (!list?.length) continue
        entry.youtubeRelease = [...list].sort((a, b) => {
          const aFull = isFullShow(a) ? 1 : 0
          const bFull = isFullShow(b) ? 1 : 0
          if (aFull !== bFull) return aFull - bFull
          return (a.release_order ?? Infinity) - (b.release_order ?? Infinity)
        })[0]
      }
    }
  }

  return { show, setlist }
}
