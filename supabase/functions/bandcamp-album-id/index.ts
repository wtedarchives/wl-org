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

const ALBUM_ID_PATTERNS: RegExp[] = [
  /<!-- album id (\d+) -->/,
  /"album_id"\s*:\s*(\d+)/,
  /data-album-id="(\d+)"/,
  /tralbum_id["']?\s*:\s*(\d+)/,
  /"tralbum_id"\s*:\s*(\d+)/,
]

function extractAlbumId(html: string): string | null {
  for (const re of ALBUM_ID_PATTERNS) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  const url = new URL(req.url)
  const rawParam = url.searchParams.get("url")

  if (!rawParam || typeof rawParam !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid url parameter" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  const trimmed = normalizeBandcampUrl(rawParam)
  if (!trimmed) {
    return new Response(
      JSON.stringify({ error: "Invalid Bandcamp URL" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  try {
    const response = await fetch(trimmed, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WysteriaLane/1.0; +https://wysterialane.org)",
        Accept: "text/html,application/xhtml+xml",
      },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Bandcamp returned ${response.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const html = await response.text()
    const albumId = extractAlbumId(html)

    if (!albumId) {
      return new Response(
        JSON.stringify({ error: "Could not find album ID in Bandcamp page" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ albumId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Bandcamp album ID fetch error:", err)
    return new Response(
      JSON.stringify({ error: "Failed to fetch Bandcamp page" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
