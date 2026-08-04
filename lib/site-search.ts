import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import {
  fetchSiteSearchCategoryDev,
  fetchSiteSearchDev,
} from "@/lib/site-search-dev"

export const SITE_SEARCH_MIN_QUERY_LENGTH = 2
export const SITE_SEARCH_PAGE_LIMIT = 40

/** True only under `next dev` — unlocks UI + client-side search without auth. */
export function isSiteSearchDevUnlocked(): boolean {
  return process.env.NODE_ENV === "development"
}

export const SITE_SEARCH_CATEGORIES = [
  "shows",
  "songs",
  "discography",
  "venues",
  "tours",
  "personnel",
] as const

export type SiteSearchCategory = (typeof SITE_SEARCH_CATEGORIES)[number]

export const SITE_SEARCH_CATEGORY_LABELS: Record<SiteSearchCategory, string> = {
  shows: "Shows",
  songs: "Songs",
  discography: "Discography",
  venues: "Venues",
  tours: "Tours",
  personnel: "Personnel",
}

export type SiteSearchShowHit = {
  id: string
  label: string
  detail?: string | null
  /** Structured fields for tour-dates table (full search page). */
  show_date?: string | null
  show_group?: string | null
  show_subvenue?: string | null
  show_venue_location?: string | null
  show_alert?: string | null
  show_tour?: string | null
  show_iscanon?: boolean
  show_canonid?: number | null
  show_wl_link?: string | null
  show_length?: string | null
  show_rarity?: string | null
  show_gap?: string | null
  show_subvenue_venue?: string | null
  venue_id?: string | null
}

export type SiteSearchSongHit = {
  id: string
  song: string
  song_displayname: string | null
}

export type SiteSearchDiscographyHit = {
  id: string
  name: string
  displayname?: string | null
  artist?: string | null
}

export type SiteSearchVenueHit = {
  id: string
  label: string
  subvenue?: string | null
  location?: string | null
}

export type SiteSearchTourHit = {
  id: string
  tour: string
}

export type SiteSearchPersonnelHit = {
  id: string
  guest: string
  guest_displayname?: string | null
}

export type SiteSearchHit =
  | SiteSearchShowHit
  | SiteSearchSongHit
  | SiteSearchDiscographyHit
  | SiteSearchVenueHit
  | SiteSearchTourHit
  | SiteSearchPersonnelHit

export type SiteSearchHasMore = Record<SiteSearchCategory, boolean>

export type SiteSearchResponse = {
  q: string
  shows: SiteSearchShowHit[]
  songs: SiteSearchSongHit[]
  discography: SiteSearchDiscographyHit[]
  venues: SiteSearchVenueHit[]
  tours: SiteSearchTourHit[]
  personnel: SiteSearchPersonnelHit[]
  hasMore: SiteSearchHasMore
}

export type SiteSearchCategoryResponse = {
  q: string
  category: SiteSearchCategory
  offset: number
  limit: number
  hasMore: boolean
  items: SiteSearchHit[]
}

function emptyHasMore(): SiteSearchHasMore {
  return {
    shows: false,
    songs: false,
    discography: false,
    venues: false,
    tours: false,
    personnel: false,
  }
}

export function siteSearchHasHits(data: SiteSearchResponse | null): boolean {
  if (!data) return false
  return (
    data.shows.length > 0 ||
    data.songs.length > 0 ||
    data.discography.length > 0 ||
    data.venues.length > 0 ||
    data.tours.length > 0 ||
    data.personnel.length > 0
  )
}

export function isSiteSearchCategory(
  value: string | null | undefined,
): value is SiteSearchCategory {
  return (
    typeof value === "string" &&
    (SITE_SEARCH_CATEGORIES as readonly string[]).includes(value)
  )
}

function functionsBase(): string {
  const base = getSupabaseFunctionsUrl()
  if (!base) throw new Error("Missing site configuration")
  return base
}

function siteSearchHeaders(accessToken: string): HeadersInit {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anon) throw new Error("Missing site configuration")
  return {
    Authorization: `Bearer ${anon}`,
    apikey: anon,
    [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
  }
}

function parseHasMore(raw: unknown): SiteSearchHasMore {
  const base = emptyHasMore()
  if (!raw || typeof raw !== "object") return base
  const obj = raw as Record<string, unknown>
  for (const key of SITE_SEARCH_CATEGORIES) {
    base[key] = obj[key] === true
  }
  return base
}

/** Ask Edge whether the current session may use site search (boolean only). */
export async function fetchSiteSearchAccess(
  accessToken: string | null | undefined,
): Promise<boolean> {
  if (isSiteSearchDevUnlocked()) return true
  if (!accessToken) return false
  const res = await fetch(`${functionsBase()}/site-search?check=1`, {
    headers: siteSearchHeaders(accessToken),
  })
  if (!res.ok) return false
  const data = (await res.json().catch(() => ({}))) as { allowed?: boolean }
  return data.allowed === true
}

export async function fetchSiteSearch(
  accessToken: string | null | undefined,
  q: string,
): Promise<SiteSearchResponse> {
  if (isSiteSearchDevUnlocked()) {
    return fetchSiteSearchDev(q)
  }
  if (!accessToken) {
    throw new Error("You must be signed in to search.")
  }

  const trimmed = q.trim()
  if (trimmed.length < SITE_SEARCH_MIN_QUERY_LENGTH) {
    throw new Error(
      `Enter at least ${SITE_SEARCH_MIN_QUERY_LENGTH} characters`,
    )
  }

  const res = await fetch(
    `${functionsBase()}/site-search?q=${encodeURIComponent(trimmed)}`,
    { headers: siteSearchHeaders(accessToken) },
  )

  const data = (await res.json().catch(() => ({}))) as SiteSearchResponse & {
    error?: string
  }

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `Search failed (${res.status})`,
    )
  }

  return {
    q: typeof data.q === "string" ? data.q : trimmed,
    shows: Array.isArray(data.shows) ? data.shows : [],
    songs: Array.isArray(data.songs) ? data.songs : [],
    discography: Array.isArray(data.discography) ? data.discography : [],
    venues: Array.isArray(data.venues) ? data.venues : [],
    tours: Array.isArray(data.tours) ? data.tours : [],
    personnel: Array.isArray(data.personnel) ? data.personnel : [],
    hasMore: parseHasMore(data.hasMore),
  }
}

export async function fetchSiteSearchCategory(opts: {
  accessToken?: string | null
  q: string
  category: SiteSearchCategory
  offset?: number
  limit?: number
}): Promise<SiteSearchCategoryResponse> {
  if (isSiteSearchDevUnlocked()) {
    return fetchSiteSearchCategoryDev(opts)
  }
  if (!opts.accessToken) {
    throw new Error("You must be signed in to search.")
  }

  const trimmed = opts.q.trim()
  if (trimmed.length < SITE_SEARCH_MIN_QUERY_LENGTH) {
    throw new Error(
      `Enter at least ${SITE_SEARCH_MIN_QUERY_LENGTH} characters`,
    )
  }

  const offset = Math.max(0, opts.offset ?? 0)
  const limit = Math.min(
    100,
    Math.max(1, opts.limit ?? SITE_SEARCH_PAGE_LIMIT),
  )

  const params = new URLSearchParams({
    q: trimmed,
    category: opts.category,
    offset: String(offset),
    limit: String(limit),
  })

  const res = await fetch(`${functionsBase()}/site-search?${params}`, {
    headers: siteSearchHeaders(opts.accessToken),
  })

  const data = (await res.json().catch(() => ({}))) as SiteSearchCategoryResponse & {
    error?: string
  }

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `Search failed (${res.status})`,
    )
  }

  return {
    q: typeof data.q === "string" ? data.q : trimmed,
    category: opts.category,
    offset,
    limit,
    hasMore: data.hasMore === true,
    items: Array.isArray(data.items) ? data.items : [],
  }
}

const SITE_SEARCH_ALL_PAGE_LIMIT = 100
const SITE_SEARCH_ALL_MAX_PAGES = 50

/** Fetch every hit for a category (pages until exhausted). Used by /archive/search. */
export async function fetchSiteSearchCategoryAll(opts: {
  accessToken?: string | null
  q: string
  category: SiteSearchCategory
}): Promise<SiteSearchHit[]> {
  const items: SiteSearchHit[] = []
  let offset = 0
  for (let page = 0; page < SITE_SEARCH_ALL_MAX_PAGES; page++) {
    const data = await fetchSiteSearchCategory({
      accessToken: opts.accessToken,
      q: opts.q,
      category: opts.category,
      offset,
      limit: SITE_SEARCH_ALL_PAGE_LIMIT,
    })
    items.push(...data.items)
    if (!data.hasMore || data.items.length === 0) break
    offset += data.items.length
  }
  return items
}
