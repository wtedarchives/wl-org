import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  getInstagramToken,
  INSTAGRAM_MAX_CAPTION_CHARS,
  isInstagramEnabled,
  publishInstagramImage,
} from "./instagram.ts"
import { loadRootShowInfo } from "./bluesky-setlist-post.ts"
import {
  formatShowDateMmDdYy,
  getSetlistShowAbsoluteUrl,
} from "./discourse-brains-chat.ts"
import type { BlueskyRootShowInfo } from "./bluesky-setlist-copy.ts"

const STORAGE_BUCKET = "setlist-images"

export type InstagramPostResult = {
  status: "created" | "skipped" | "disabled" | "failed"
  mediaId?: string
  error?: string
}

const clean = (value: string | null | undefined): string => (value ?? "").trim()

/**
 * Songs whose `entry_short` is never rendered. Mirrors
 * `ENTRY_SHORT_HIDDEN_FOR_SONGS` in
 * `components/dpro/setlist/display-setlist-table.constants.ts` — duplicated
 * because edge functions can't import from the Next app. Keep the two in sync.
 */
const ENTRY_SHORT_HIDDEN_FOR_SONGS = new Set([
  "Charge",
  "First Call",
  "Happy Birthday to You",
  "[Trevor Reads Poetry]",
])

export type CaptionEntry = {
  entry_set: string | null
  entry_setnum: number | null
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  songs?: { song_displayname: string | null } | null
}

/** Separator printed between sets. */
const SET_SEPARATOR = "---"

/**
 * Plain-text setlist for the caption.
 *
 *     Royal ->
 *     The Whales ->
 *     No California
 *     ---
 *     Arrow ->
 *
 * Display names are preferred over raw `entry_song`. `entry_short` renders as a
 * bracketed tag (`unfinished`, `reprise`, …) matching how the card annotates it,
 * and `entry_segue` — always `>` in the data — becomes a trailing `->`.
 */
export function buildInstagramSetlistText(entries: CaptionEntry[]): string {
  const lines: string[] = []
  let previousSet: string | null = null

  for (const entry of entries) {
    const set = clean(entry.entry_set)
    if (previousSet !== null && set !== previousSet) lines.push(SET_SEPARATOR)
    previousSet = set

    const song = clean(entry.entry_song)
    const name = clean(entry.songs?.song_displayname) || song || "—"

    const short = clean(entry.entry_short)
    const showShort = short && !ENTRY_SHORT_HIDDEN_FOR_SONGS.has(song)

    // The column stores a bare `>`. Any `>` is stripped and replaced with a
    // literal `->` so the raw character can never reach the caption, even if a
    // row someday holds `>>` or `> partial`.
    const segueRaw = clean(entry.entry_segue)
    const hasSegue = segueRaw.length > 0
    const segueNote = segueRaw.replace(/>/g, "").trim()

    lines.push(
      [name, showShort ? `[${short}]` : "", hasSegue ? "->" : "", segueNote]
        .filter(Boolean)
        .join(" "),
    )
  }

  return lines.join("\n")
}

/** Show-context header — date, venue, tour position. */
function buildCaptionHeader(info: BlueskyRootShowInfo): string {
  const date = formatShowDateMmDdYy(info.showDate)
  const group = clean(info.showGroup)
  const subvenue = clean(info.showSubvenue)
  const location = clean(info.showVenueLocation) || "Unknown"
  const detail = clean(info.showDetail)
  const tour = clean(info.showTour)
  const counter =
    info.tourPosition ?
      `Show ${info.tourPosition.position} of ${info.tourPosition.total}`
    : ""

  return [
    group ? `${date} – ${group}` : date,
    subvenue ? `${subvenue} – ${location}` : location,
    detail,
    tour && counter ? `${tour} – ${counter}`
    : tour ? tour
    : counter,
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * Caption for the end-of-show post: show header, then the text setlist.
 *
 * Falls back to the setlist URL when there are no entries to print. Instagram
 * captions aren't linkified, so that URL is text people have to type — it's a
 * fallback, not the primary payload.
 */
export function buildInstagramCaption(
  info: BlueskyRootShowInfo,
  entries: CaptionEntry[],
): string {
  const header = buildCaptionHeader(info)
  const setlist = buildInstagramSetlistText(entries)
  if (!setlist) {
    return `${header}\n\nFull setlist: ${getSetlistShowAbsoluteUrl(info.showId)}`
  }

  const caption = `${header}\n\n${setlist}`
  if (caption.length <= INSTAGRAM_MAX_CAPTION_CHARS) return caption

  // Very long setlist — keep the header and as many songs as fit.
  console.error(
    `instagram caption ${caption.length} chars exceeds ${INSTAGRAM_MAX_CAPTION_CHARS}; trimming`,
  )
  const budget = INSTAGRAM_MAX_CAPTION_CHARS - header.length - 4
  const kept: string[] = []
  let used = 0
  for (const line of setlist.split("\n")) {
    if (used + line.length + 1 > budget) break
    kept.push(line)
    used += line.length + 1
  }
  return `${header}\n\n${kept.join("\n")}\n…`
}

/** Entries in card order: set ascending, then position within the set. */
async function loadCaptionEntries(
  db: SupabaseClient,
  showId: string,
): Promise<CaptionEntry[]> {
  const { data, error } = await db
    .from("setlist_entries")
    .select(
      "entry_set, entry_setnum, entry_song, entry_short, entry_segue, songs ( song_displayname )",
    )
    .eq("entry_show", showId)
    .order("entry_set", { ascending: true })
    .order("entry_setnum", { ascending: true })
  if (error) {
    console.error("instagram caption entries:", error.message)
    return []
  }
  return (data ?? []) as unknown as CaptionEntry[]
}

/** Base64 JPEG (tolerating a data: prefix) → bytes. */
function decodeJpegBase64(base64: string | undefined): Uint8Array | undefined {
  const raw = (base64 ?? "").trim()
  if (!raw) return undefined
  try {
    const payload = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes.byteLength > 0 ? bytes : undefined
  } catch (err) {
    console.error("instagram image decode:", err)
    return undefined
  }
}

/**
 * Host the JPEG publicly and return its URL.
 *
 * Instagram fetches `image_url` server-side and has no binary upload path, so
 * the image must be publicly reachable. A `v` cache-buster is appended because
 * the object path is stable per show and Meta may otherwise serve a stale fetch.
 */
async function uploadInstagramImage(
  db: SupabaseClient,
  showId: string,
  bytes: Uint8Array,
): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim()
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL")

  const path = `${showId}/${showId}_ig.jpg`
  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true })
  if (error) throw new Error(`Instagram image upload failed: ${error.message}`)

  const base = supabaseUrl.replace(/\/$/, "")
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}?v=${Date.now()}`
}

/**
 * Publish the show's setlist card to Instagram. Called on `end_show`.
 *
 * Idempotent per show: a second end-of-show press won't post twice, since
 * Instagram has no edit and a duplicate would just be noise on the feed.
 */
export async function postSetlistToInstagram(
  db: SupabaseClient,
  showId: string,
  options: { imageJpegBase64?: string } = {},
): Promise<InstagramPostResult> {
  try {
    if (!(await isInstagramEnabled(db))) return { status: "disabled" }

    const igUserId = Deno.env.get("INSTAGRAM_USER_ID")?.trim()
    if (!igUserId) {
      return { status: "failed", error: "Missing INSTAGRAM_USER_ID." }
    }

    const { data: existing, error: existingErr } = await db
      .from("instagram_posts")
      .select("id, media_id")
      .eq("show_id", showId)
      .maybeSingle()
    if (existingErr) throw new Error(existingErr.message)
    if (existing) {
      return { status: "skipped", mediaId: existing.media_id as string }
    }

    const bytes = decodeJpegBase64(options.imageJpegBase64)
    if (!bytes) {
      return {
        status: "failed",
        error: "No setlist image was captured for Instagram.",
      }
    }

    const token = await getInstagramToken(db)
    if (!token) {
      return { status: "failed", error: "No usable Instagram access token." }
    }

    const [info, captionEntries] = await Promise.all([
      loadRootShowInfo(db, showId),
      loadCaptionEntries(db, showId),
    ])
    const caption = buildInstagramCaption(info, captionEntries)
    const imageUrl = await uploadInstagramImage(db, showId, bytes)

    const published = await publishInstagramImage({
      igUserId,
      token,
      imageUrl,
      caption,
      altText: `Setlist for ${formatShowDateMmDdYy(info.showDate)} — ${
        clean(info.showSubvenue) || clean(info.showVenueLocation) || "show"
      }`,
    })

    const { error: insertErr } = await db.from("instagram_posts").insert({
      show_id: showId,
      media_id: published.mediaId,
      container_id: published.containerId,
      image_url: imageUrl,
      caption,
    })
    // The post is live; losing the row only costs us the duplicate guard.
    if (insertErr) console.error("instagram_posts insert:", insertErr.message)

    return { status: "created", mediaId: published.mediaId }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Instagram post failed"
    console.error("postSetlistToInstagram:", error)
    return { status: "failed", error }
  }
}
