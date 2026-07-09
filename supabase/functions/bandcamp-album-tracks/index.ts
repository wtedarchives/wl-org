import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

/** DB / links sometimes omit protocol or use a leading slash path. */
function normalizeBandcampUrl(raw: string): string | null {
  let s = raw.trim()
  if (s.startsWith("//")) {
    s = `https:${s}`
  } else if (s.startsWith("/") && s.includes("bandcamp.com")) {
    s = `https://${s.replace(/^\/+/, "")}`
  } else if (!/^https?:\/\//i.test(s) && s.includes("bandcamp.com")) {
    s = `https://${s.replace(/^\/+/, "")}`
  }
  try {
    const u = new URL(s)
    if (!u.hostname.includes("bandcamp.com")) return null
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.toString()
  } catch {
    return null
  }
}

/** Minimal HTML entity decode for attribute values (`&quot;`, `&amp;`, `&#39;`, …). */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0?38;/g, "&")
    .replace(/&amp;/g, "&")
}

interface BandcampTrack {
  track_id: number
  title: string
  track_link: string
}

interface BandcampAlbum {
  album_id: number
  album_url: string
  album_title: string | null
  tracks: BandcampTrack[]
}

/**
 * Parse the `data-tralbum` JSON blob embedded in a Bandcamp album page. One blob holds the
 * album id and, per track, `track_id` + `title` + relative `title_link` — so no per-track scrape.
 */
function parseBandcampAlbum(html: string, pageOrigin: string): BandcampAlbum | null {
  const m = html.match(/data-tralbum="([^"]*)"/)
  if (!m?.[1]) return null

  let data: {
    id?: unknown
    url?: unknown
    current?: { id?: unknown; title?: unknown }
    trackinfo?: Array<{ track_id?: unknown; title?: unknown; title_link?: unknown }>
  }
  try {
    data = JSON.parse(decodeHtmlEntities(m[1]))
  } catch {
    return null
  }

  const albumId = Number(data.id ?? data.current?.id)
  if (!Number.isFinite(albumId) || albumId <= 0) return null

  const albumUrl = typeof data.url === "string" ? data.url : ""
  const albumTitle = typeof data.current?.title === "string" ? data.current.title : null
  const origin = pageOrigin.replace(/\/$/, "")

  const tracks: BandcampTrack[] = (data.trackinfo ?? [])
    .map((t) => {
      const trackId = Number(t.track_id)
      const link = typeof t.title_link === "string" ? t.title_link : ""
      const title = typeof t.title === "string" ? t.title : ""
      if (!Number.isFinite(trackId) || trackId <= 0 || !link) return null
      return {
        track_id: trackId,
        title,
        track_link: link.startsWith("http") ? link : `${origin}${link}`,
      }
    })
    .filter((t): t is BandcampTrack => t !== null)

  return { album_id: albumId, album_url: albumUrl, album_title: albumTitle, tracks }
}

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405)

  const rawParam = new URL(req.url).searchParams.get("url")
  if (!rawParam) return json({ error: "Missing url parameter" }, 400)

  const albumUrl = normalizeBandcampUrl(rawParam)
  if (!albumUrl) return json({ error: "Invalid Bandcamp URL" }, 400)

  let html: string
  try {
    const res = await fetch(albumUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WysteriaLane/1.0; +https://wysterialane.org)",
        Accept: "text/html,application/xhtml+xml",
      },
    })
    if (!res.ok) return json({ error: `Bandcamp returned ${res.status}` }, 502)
    html = await res.text()
  } catch (err) {
    console.error("Bandcamp album tracks fetch error:", err)
    return json({ error: "Failed to fetch Bandcamp page" }, 502)
  }

  const album = parseBandcampAlbum(html, new URL(albumUrl).origin)
  if (!album || album.tracks.length === 0) {
    return json({ error: "Could not parse tracks from Bandcamp page" }, 404)
  }

  return json({ ...album, album_url: album.album_url || albumUrl }, 200)
})
