/**
 * Local-only site search via the anon Supabase client.
 * Used when `next dev` unlocks search without auth — never used in production builds.
 */
import { excludeRecordingSessionShows } from "@/lib/show-recording-session-filter"
import { supabase } from "@/lib/supabase"
import type {
  SiteSearchCategory,
  SiteSearchCategoryResponse,
  SiteSearchResponse,
} from "@/lib/site-search"

const MIN_Q = 2
const PREVIEW_LIMIT = 8
const PAGE_LIMIT = 40
const DIVIDER = " – "

function escapeIlike(q: string): string {
  return q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

function ilikePattern(q: string): string {
  return `%${escapeIlike(q)}%`
}

function mmddyy(raw: string | null | undefined): string {
  if (!raw) return ""
  const d = new Date(`${String(raw).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return String(raw)
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const yy = String(d.getUTCFullYear()).slice(-2)
  return `${mm}.${dd}.${yy}`
}

function joinParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join(DIVIDER)
}

function sliceWithMore<T>(rows: T[], limit: number): { items: T[]; hasMore: boolean } {
  return {
    items: rows.slice(0, limit),
    hasMore: rows.length > limit,
  }
}

function requireClient() {
  if (!supabase) throw new Error("Missing site configuration")
  return supabase
}

async function searchShows(q: string, limit: number, offset: number) {
  const db = requireClient()
  const pattern = ilikePattern(q)
  const { data, error } = await db
    .from("shows")
    .select(
      `
      show_id,
      show_date,
      show_group,
      show_subvenue,
      show_venue_location,
      show_detail,
      show_alert,
      show_tour,
      show_iscanon,
      show_canonid,
      show_wl_link,
      show_length,
      show_rarity,
      show_gap,
      show_subvenue_venue,
      subvenues:show_subvenue(
        venues:subvenue_venue(
          venue_id
        )
      )
      `,
    )
    .or(
      `show_group.ilike.${pattern},show_subvenue.ilike.${pattern},show_venue_location.ilike.${pattern},show_detail.ilike.${pattern}`,
    )
    .order("show_date", { ascending: true })
    .range(offset, offset + limit)

  if (error) throw error

  const filtered = excludeRecordingSessionShows(data ?? []).map((row) => {
    const detail = (row.show_detail ?? "").trim()
    const subvenues = row.subvenues as
      | { venues?: { venue_id: string } | { venue_id: string }[] | null }
      | null
      | undefined
    const venues = subvenues?.venues
    const venueId = Array.isArray(venues) ? venues[0]?.venue_id : venues?.venue_id
    const rarity =
      row.show_rarity != null && String(row.show_rarity).trim() !== "" ?
        `${Number(row.show_rarity).toFixed(2)}%`
      : null
    const gap =
      row.show_gap != null && String(row.show_gap).trim() !== "" ?
        Number(row.show_gap).toFixed(2)
      : null
    return {
      id: row.show_id as string,
      label:
        joinParts([
          mmddyy(row.show_date),
          row.show_group,
          row.show_subvenue,
          row.show_venue_location,
        ]) || mmddyy(row.show_date) || "Show",
      detail: detail.length > 0 ? detail : null,
      show_date: row.show_date as string | null,
      show_group: (row.show_group as string | null) ?? null,
      show_subvenue: (row.show_subvenue as string | null) ?? null,
      show_venue_location: (row.show_venue_location as string | null) ?? null,
      show_alert: (row.show_alert as string | null) ?? null,
      show_tour: (row.show_tour as string | null) ?? null,
      show_iscanon: Boolean(row.show_iscanon),
      show_canonid: (row.show_canonid as number | null) ?? null,
      show_wl_link: (row.show_wl_link as string | null) ?? null,
      show_length: (row.show_length as string | null) ?? null,
      show_rarity: rarity,
      show_gap: gap,
      show_subvenue_venue: (row.show_subvenue_venue as string | null) ?? null,
      venue_id: venueId ?? null,
    }
  })
  return sliceWithMore(filtered, limit)
}

async function searchSongs(q: string, limit: number, offset: number) {
  const db = requireClient()
  const pattern = ilikePattern(q)
  const { data, error } = await db
    .from("songs")
    .select("song_id, song, song_displayname")
    .eq("song_placeholder", false)
    .or(`song.ilike.${pattern},song_displayname.ilike.${pattern}`)
    .order("song", { ascending: true })
    .range(offset, offset + limit)
  if (error) throw error
  const mapped = (data ?? []).map((row) => ({
    id: row.song_id as string,
    song: row.song as string,
    song_displayname: row.song_displayname as string | null,
  }))
  return sliceWithMore(mapped, limit)
}

async function searchDiscography(q: string, limit: number, offset: number) {
  const db = requireClient()
  const { data, error } = await db
    .from("discography")
    .select("uuid, name, displayname, artist")
    .ilike("name", ilikePattern(q))
    .order("name", { ascending: true })
    .range(offset, offset + limit)
  if (error) throw error
  const mapped = (data ?? []).map((row) => {
    const artist = String(row.artist ?? "").trim()
    return {
      id: row.uuid as string,
      name: (row.name as string) ?? "",
      displayname: row.displayname as string | null,
      artist: artist.length > 0 ? artist : null,
    }
  })
  return sliceWithMore(mapped, limit)
}

async function searchVenues(q: string, limit: number, offset: number) {
  const db = requireClient()
  const pattern = ilikePattern(q)
  const fetchLimit = Math.min((offset + limit + 1) * 4, 500)
  const { data, error } = await db
    .from("subvenues")
    .select(
      `
      subvenue,
      subvenue_venue,
      subvenue_venue_location,
      venues:subvenue_venue ( venue_id )
    `,
    )
    .or(`subvenue.ilike.${pattern},subvenue_venue_location.ilike.${pattern}`)
    .order("subvenue", { ascending: true })
    .limit(fetchLimit)
  if (error) throw error

  const seen = new Set<string>()
  const unique: Array<{
    id: string
    label: string
    subvenue: string | null
    location: string | null
  }> = []
  for (const row of data ?? []) {
    const v = row.venues as { venue_id: string } | { venue_id: string }[] | null
    const venueId = Array.isArray(v) ? v[0]?.venue_id : v?.venue_id
    const key = venueId || (row.subvenue_venue as string) || ""
    if (!key || seen.has(key)) continue
    seen.add(key)
    const subvenue = String(row.subvenue ?? "").trim() || null
    const location = String(row.subvenue_venue_location ?? "").trim() || null
    unique.push({
      id: key,
      label: joinParts([subvenue, location]) || subvenue || "Venue",
      subvenue,
      location,
    })
  }
  return sliceWithMore(unique.slice(offset, offset + limit + 1), limit)
}

async function searchTours(q: string, limit: number, offset: number) {
  const db = requireClient()
  const { data, error } = await db
    .from("tours")
    .select("tour_id, tour")
    .ilike("tour", ilikePattern(q))
    .order("tour_canonid", { ascending: true })
    .range(offset, offset + limit)
  if (error) throw error
  const mapped = (data ?? []).map((row) => ({
    id: row.tour_id as string,
    tour: (row.tour as string) ?? "",
  }))
  return sliceWithMore(mapped, limit)
}

async function searchPersonnel(q: string, limit: number, offset: number) {
  const db = requireClient()
  const pattern = ilikePattern(q)
  const { data, error } = await db
    .from("guests")
    .select("guest_id, guest, guest_displayname")
    .or(`guest.ilike.${pattern},guest_displayname.ilike.${pattern}`)
    .order("guest", { ascending: true })
    .range(offset, offset + limit)
  if (error) throw error
  const mapped = (data ?? []).map((row) => ({
    id: row.guest_id as string,
    guest: (row.guest as string) ?? "",
    guest_displayname: row.guest_displayname as string | null,
  }))
  return sliceWithMore(mapped, limit)
}

async function searchCategory(
  category: SiteSearchCategory,
  q: string,
  limit: number,
  offset: number,
) {
  switch (category) {
    case "shows":
      return searchShows(q, limit, offset)
    case "songs":
      return searchSongs(q, limit, offset)
    case "discography":
      return searchDiscography(q, limit, offset)
    case "venues":
      return searchVenues(q, limit, offset)
    case "tours":
      return searchTours(q, limit, offset)
    case "personnel":
      return searchPersonnel(q, limit, offset)
  }
}

export async function fetchSiteSearchDev(q: string): Promise<SiteSearchResponse> {
  const trimmed = q.trim()
  if (trimmed.length < MIN_Q) {
    throw new Error(`Enter at least ${MIN_Q} characters`)
  }

  const [shows, songs, discography, venues, tours, personnel] =
    await Promise.all([
      searchShows(trimmed, PREVIEW_LIMIT, 0),
      searchSongs(trimmed, PREVIEW_LIMIT, 0),
      searchDiscography(trimmed, PREVIEW_LIMIT, 0),
      searchVenues(trimmed, PREVIEW_LIMIT, 0),
      searchTours(trimmed, PREVIEW_LIMIT, 0),
      searchPersonnel(trimmed, PREVIEW_LIMIT, 0),
    ])

  return {
    q: trimmed,
    shows: shows.items,
    songs: songs.items,
    discography: discography.items,
    venues: venues.items,
    tours: tours.items,
    personnel: personnel.items,
    hasMore: {
      shows: shows.hasMore,
      songs: songs.hasMore,
      discography: discography.hasMore,
      venues: venues.hasMore,
      tours: tours.hasMore,
      personnel: personnel.hasMore,
    },
  }
}

export async function fetchSiteSearchCategoryDev(opts: {
  q: string
  category: SiteSearchCategory
  offset?: number
  limit?: number
}): Promise<SiteSearchCategoryResponse> {
  const trimmed = opts.q.trim()
  if (trimmed.length < MIN_Q) {
    throw new Error(`Enter at least ${MIN_Q} characters`)
  }
  const offset = Math.max(0, opts.offset ?? 0)
  const limit = Math.min(100, Math.max(1, opts.limit ?? PAGE_LIMIT))
  const { items, hasMore } = await searchCategory(
    opts.category,
    trimmed,
    limit,
    offset,
  )
  return {
    q: trimmed,
    category: opts.category,
    offset,
    limit,
    hasMore,
    items,
  }
}
