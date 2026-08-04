/**
 * Public site-wide archive search for the React header + /archive/search page.
 *
 * GET /functions/v1/site-search?q=...
 *   Preview across all categories (8 each) + hasMore flags.
 *
 * GET /functions/v1/site-search?q=...&category=shows&offset=0&limit=40
 *   Single-category page (paginated).
 *
 * Gateway still requires Authorization / apikey (anon). This handler uses the
 * service role for DB reads.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { resolveSiteSearchCaller } from "../_shared/site-search-allowlist.ts"

const PREVIEW_LIMIT = 8
const PAGE_DEFAULT_LIMIT = 40
const PAGE_MAX_LIMIT = 100
const MIN_Q = 2
const DIVIDER = " – "
/** Same exclusion as years / archive show lists (`lib/show-recording-session-filter.ts`). */
const RECORDING_SESSION_DETAIL_PHRASE = "Recording Session"

const CATEGORIES = [
  "shows",
  "songs",
  "discography",
  "venues",
  "tours",
  "personnel",
] as const

type Category = (typeof CATEGORIES)[number]

type ShowRow = {
  show_id: string
  show_date: string | null
  show_group: string | null
  show_subvenue: string | null
  show_venue_location: string | null
  show_detail: string | null
  show_alert: string | null
  show_tour: string | null
  show_iscanon: boolean | null
  show_canonid: number | null
  show_wl_link: string | null
  show_length: string | null
  show_rarity: number | string | null
  show_gap: number | string | null
  show_subvenue_venue: string | null
  subvenues?: {
    venues?: { venue_id: string } | { venue_id: string }[] | null
  } | null
}

type SongRow = {
  song_id: string
  song: string
  song_displayname: string | null
}

type DiscographyRow = {
  uuid: string
  name: string | null
  displayname: string | null
  artist: string | null
}

type SubvenueRow = {
  subvenue: string | null
  subvenue_venue: string | null
  subvenue_venue_location: string | null
  venues: { venue_id: string } | { venue_id: string }[] | null
}

type TourRow = {
  tour_id: string
  tour: string | null
}

type GuestRow = {
  guest_id: string
  guest: string | null
  guest_displayname: string | null
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function orIlikeClause(column: string, q: string): string {
  const escaped = q
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/"/g, '\\"')
  const needsQuotes = /[,.():]/.test(escaped) || /\s/.test(escaped)
  const value = needsQuotes ? `"*${escaped}*"` : `*${escaped}*`
  return `${column}.ilike.${value}`
}

function ilikePattern(q: string): string {
  const escaped = q
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
  return `%${escaped}%`
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

function formatShowLabel(row: ShowRow): string {
  return joinParts([
    mmddyy(row.show_date),
    row.show_group,
    row.show_subvenue,
    row.show_venue_location,
  ])
}

function showDateOrClauses(q: string): string[] {
  const clauses: string[] = []
  const trimmed = q.trim()

  const full = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/)
  if (full) {
    const mm = full[1].padStart(2, "0")
    const dd = full[2].padStart(2, "0")
    let yyyy: number
    if (full[3].length === 4) {
      yyyy = Number(full[3])
    } else {
      const yy = Number(full[3])
      yyyy = yy >= 70 ? 1900 + yy : 2000 + yy
    }
    clauses.push(`show_date.eq.${yyyy}-${mm}-${dd}`)
  }

  if (/^\d{4}$/.test(trimmed)) {
    clauses.push(
      `and(show_date.gte.${trimmed}-01-01,show_date.lte.${trimmed}-12-31)`,
    )
  }

  return clauses
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

function mapShow(row: ShowRow) {
  const detail = (row.show_detail ?? "").trim()
  const venues = row.subvenues?.venues
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
    id: row.show_id,
    label: formatShowLabel(row) || mmddyy(row.show_date) || "Show",
    detail: detail.length > 0 ? detail : null,
    show_date: row.show_date,
    show_group: row.show_group,
    show_subvenue: row.show_subvenue,
    show_venue_location: row.show_venue_location,
    show_alert: row.show_alert,
    show_tour: row.show_tour,
    show_iscanon: row.show_iscanon ?? false,
    show_canonid: row.show_canonid,
    show_wl_link: row.show_wl_link,
    show_length: row.show_length,
    show_rarity: rarity,
    show_gap: gap,
    show_subvenue_venue: row.show_subvenue_venue,
    venue_id: venueId ?? null,
  }
}

function mapSong(row: SongRow) {
  return {
    id: row.song_id,
    song: row.song,
    song_displayname: row.song_displayname,
  }
}

function mapDisco(row: DiscographyRow) {
  const artist = (row.artist ?? "").trim()
  return {
    id: row.uuid,
    name: row.name ?? "",
    displayname: row.displayname,
    artist: artist.length > 0 ? artist : null,
  }
}

function mapVenue(row: SubvenueRow): {
  id: string
  label: string
  subvenue: string | null
  location: string | null
} | null {
  const v = row.venues
  const venueId = Array.isArray(v) ? v[0]?.venue_id : v?.venue_id
  const key = venueId || row.subvenue_venue || ""
  if (!key) return null
  const subvenue = (row.subvenue ?? "").trim() || null
  const location = (row.subvenue_venue_location ?? "").trim() || null
  return {
    id: key,
    label: joinParts([subvenue, location]) || subvenue || "Venue",
    subvenue,
    location,
  }
}

function mapTour(row: TourRow) {
  return { id: row.tour_id, tour: row.tour ?? "" }
}

function mapGuest(row: GuestRow) {
  return {
    id: row.guest_id,
    guest: row.guest ?? "",
    guest_displayname: row.guest_displayname,
  }
}

function sliceWithMore<T>(rows: T[], limit: number): { items: T[]; hasMore: boolean } {
  return {
    items: rows.slice(0, limit),
    hasMore: rows.length > limit,
  }
}

async function searchShows(
  db: SupabaseClient,
  q: string,
  limit: number,
  offset: number,
) {
  const showOr = [
    orIlikeClause("show_group", q),
    orIlikeClause("show_subvenue", q),
    orIlikeClause("show_venue_location", q),
    orIlikeClause("show_detail", q),
    ...showDateOrClauses(q),
  ].join(",")

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
    .or(showOr)
    // Keep null details; drop “Recording Session” shows (years component parity).
    .or(
      `show_detail.is.null,show_detail.not.ilike."*${RECORDING_SESSION_DETAIL_PHRASE}*"`,
    )
    .order("show_date", { ascending: true })
    .range(offset, offset + limit) // inclusive → limit+1 rows

  if (error) throw error
  const mapped = ((data ?? []) as ShowRow[]).map(mapShow)
  return sliceWithMore(mapped, limit)
}

async function searchSongs(
  db: SupabaseClient,
  q: string,
  limit: number,
  offset: number,
) {
  const { data, error } = await db
    .from("songs")
    .select("song_id, song, song_displayname")
    .eq("song_placeholder", false)
    .or(`${orIlikeClause("song", q)},${orIlikeClause("song_displayname", q)}`)
    .order("song", { ascending: true })
    .range(offset, offset + limit)

  if (error) throw error
  const mapped = ((data ?? []) as SongRow[]).map(mapSong)
  return sliceWithMore(mapped, limit)
}

async function searchDiscography(
  db: SupabaseClient,
  q: string,
  limit: number,
  offset: number,
) {
  const { data, error } = await db
    .from("discography")
    .select("uuid, name, displayname, artist")
    .ilike("name", ilikePattern(q))
    .order("name", { ascending: true })
    .range(offset, offset + limit)

  if (error) throw error
  const mapped = ((data ?? []) as DiscographyRow[]).map(mapDisco)
  return sliceWithMore(mapped, limit)
}

async function searchVenues(
  db: SupabaseClient,
  q: string,
  limit: number,
  offset: number,
) {
  // Over-fetch subvenue rows then dedupe by venue key (same as preview).
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
    .or(
      `${orIlikeClause("subvenue", q)},${orIlikeClause("subvenue_venue_location", q)}`,
    )
    .order("subvenue", { ascending: true })
    .limit(fetchLimit)

  if (error) throw error

  const seen = new Set<string>()
  const unique: NonNullable<ReturnType<typeof mapVenue>>[] = []
  for (const row of (data ?? []) as SubvenueRow[]) {
    const mapped = mapVenue(row)
    if (!mapped || seen.has(mapped.id)) continue
    seen.add(mapped.id)
    unique.push(mapped)
  }

  const page = unique.slice(offset, offset + limit + 1)
  return sliceWithMore(page, limit)
}

async function searchTours(
  db: SupabaseClient,
  q: string,
  limit: number,
  offset: number,
) {
  const { data, error } = await db
    .from("tours")
    .select("tour_id, tour")
    .ilike("tour", ilikePattern(q))
    .order("tour_canonid", { ascending: true })
    .range(offset, offset + limit)

  if (error) throw error
  const mapped = ((data ?? []) as TourRow[]).map(mapTour)
  return sliceWithMore(mapped, limit)
}

async function searchPersonnel(
  db: SupabaseClient,
  q: string,
  limit: number,
  offset: number,
) {
  const { data, error } = await db
    .from("guests")
    .select("guest_id, guest, guest_displayname")
    .or(
      `${orIlikeClause("guest", q)},${orIlikeClause("guest_displayname", q)}`,
    )
    .order("guest", { ascending: true })
    .range(offset, offset + limit)

  if (error) throw error
  const mapped = ((data ?? []) as GuestRow[]).map(mapGuest)
  return sliceWithMore(mapped, limit)
}

async function searchCategory(
  db: SupabaseClient,
  category: Category,
  q: string,
  limit: number,
  offset: number,
) {
  switch (category) {
    case "shows":
      return searchShows(db, q, limit, offset)
    case "songs":
      return searchSongs(db, q, limit, offset)
    case "discography":
      return searchDiscography(db, q, limit, offset)
    case "venues":
      return searchVenues(db, q, limit, offset)
    case "tours":
      return searchTours(db, q, limit, offset)
    case "personnel":
      return searchPersonnel(db, q, limit, offset)
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const caller = await resolveSiteSearchCaller(req)
  if (!caller.ok) {
    return jsonResponse({ error: caller.error }, caller.status)
  }

  const url = new URL(req.url)

  // Access probe — returns only a boolean (never the allowlist).
  if (url.searchParams.get("check") === "1") {
    return jsonResponse({ allowed: true })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Server configuration error" }, 500)
  }

  const q = (url.searchParams.get("q") ?? "").trim()
  if (q.length < MIN_Q) {
    return jsonResponse(
      { error: `Query must be at least ${MIN_Q} characters` },
      400,
    )
  }

  const categoryParam = (url.searchParams.get("category") ?? "").trim()
  const offset = Math.max(
    0,
    Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
  )
  const limitRaw = Number.parseInt(
    url.searchParams.get("limit") ?? String(PAGE_DEFAULT_LIMIT),
    10,
  )
  const pageLimit = Math.min(
    PAGE_MAX_LIMIT,
    Math.max(1, Number.isFinite(limitRaw) ? limitRaw : PAGE_DEFAULT_LIMIT),
  )

  const db = createClient(supabaseUrl, serviceKey)

  try {
    if (categoryParam) {
      if (!isCategory(categoryParam)) {
        return jsonResponse(
          {
            error:
              "Invalid category. Use shows|songs|discography|venues|tours|personnel",
          },
          400,
        )
      }

      const { items, hasMore } = await searchCategory(
        db,
        categoryParam,
        q,
        pageLimit,
        offset,
      )

      return jsonResponse({
        q,
        category: categoryParam,
        offset,
        limit: pageLimit,
        hasMore,
        items,
      })
    }

    const [
      shows,
      songs,
      discography,
      venues,
      tours,
      personnel,
    ] = await Promise.all([
      searchShows(db, q, PREVIEW_LIMIT, 0),
      searchSongs(db, q, PREVIEW_LIMIT, 0),
      searchDiscography(db, q, PREVIEW_LIMIT, 0),
      searchVenues(db, q, PREVIEW_LIMIT, 0),
      searchTours(db, q, PREVIEW_LIMIT, 0),
      searchPersonnel(db, q, PREVIEW_LIMIT, 0),
    ])

    return jsonResponse({
      q,
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
    })
  } catch (err) {
    console.error("site-search error", err)
    return jsonResponse({ error: "Search failed" }, 500)
  }
})
