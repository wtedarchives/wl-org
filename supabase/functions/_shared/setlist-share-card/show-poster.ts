/**
 * Show poster lookup, shared by the Bluesky thread root and the share card.
 *
 * Deno-only: it talks to the database. The card itself never sees a URL — the
 * poster reaches it as a data URI inside the view model, so the renderer stays
 * free of network calls.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

/** First poster image linked to this show, if any. `show_posters.show` is jsonb. */
export async function loadShowPosterImage(
  db: SupabaseClient,
  showId: string,
): Promise<string | undefined> {
  const { data, error } = await db
    .from("show_posters")
    .select("image")
    .filter("show", "cs", JSON.stringify([showId]))
    .not("image", "is", null)
    .limit(1)
  if (error) {
    console.error("show poster lookup:", error.message)
    return undefined
  }
  const image = (data?.[0]?.image as string | null)?.trim()
  return image || undefined
}

/**
 * Routes a Supabase public-object URL through the image transform endpoint.
 *
 * Mirrors `boundedSupabaseImageUrl` in `../bluesky.ts`, but defaults small: the
 * poster occupies about 170 design px on the card, so a 600px edge is already
 * generous and keeps the base64 out of the request body's way.
 */
export function boundedPosterUrl(
  imageUrl: string,
  maxEdge = 600,
  quality = 80,
): string {
  const url = imageUrl.trim()
  const marker = "/storage/v1/object/public/"
  if (!url.includes(marker)) return url
  const transformed = url.replace(marker, "/storage/v1/render/image/public/")
  const separator = transformed.includes("?") ? "&" : "?"
  return `${transformed}${separator}width=${maxEdge}&height=${maxEdge}&resize=contain&quality=${quality}`
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/**
 * The show's poster as a data URI, or null when there isn't one.
 *
 * Never throws — the card is perfectly readable without a poster, and losing
 * the whole image over a missing one would be a bad trade.
 */
export async function loadShowPosterDataUri(
  db: SupabaseClient,
  showId: string,
): Promise<string | null> {
  try {
    const raw = await loadShowPosterImage(db, showId)
    if (!raw) return null

    const res = await fetch(boundedPosterUrl(raw))
    if (!res.ok) {
      console.error(`show poster fetch: ${res.status} for ${raw}`)
      return null
    }
    const type = res.headers.get("content-type")?.split(";")[0]?.trim()
    const mime = type && type.startsWith("image/") ? type : "image/jpeg"
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.length === 0) return null

    return `data:${mime};base64,${toBase64(bytes)}`
  } catch (err) {
    console.error("show poster load:", err)
    return null
  }
}
