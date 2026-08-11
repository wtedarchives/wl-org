import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  getInstagramToken,
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
 * Caption for the end-of-show post. Instagram captions aren't linkified, so the
 * URL is plain text people have to type — hence "Full setlist:" framing rather
 * than pretending it's a link.
 */
export function buildInstagramCaption(info: BlueskyRootShowInfo): string {
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

  const lines = [
    group ? `${date} – ${group}` : date,
    subvenue ? `${subvenue} – ${location}` : location,
    detail,
    tour && counter ? `${tour} – ${counter}`
    : tour ? tour
    : counter,
  ].filter(Boolean)

  return `${lines.join("\n")}\n\nFull setlist: ${getSetlistShowAbsoluteUrl(info.showId)}`
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

    const info = await loadRootShowInfo(db, showId)
    const caption = buildInstagramCaption(info)
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
