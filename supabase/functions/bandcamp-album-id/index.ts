import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const BANDCAMP_ALBUM_ID_REGEX = /<!-- album id (\d+) -->/

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const url = new URL(req.url)
  const bandcampUrl = url.searchParams.get("url")

  if (!bandcampUrl || typeof bandcampUrl !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid url parameter" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const trimmed = bandcampUrl.trim()
  if (
    !trimmed.startsWith("https://") ||
    !trimmed.includes("bandcamp.com")
  ) {
    return new Response(
      JSON.stringify({ error: "Invalid Bandcamp URL" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  try {
    const response = await fetch(trimmed, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WysteriaLane/1.0; +https://wysterialane.org)",
      },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Bandcamp returned ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const html = await response.text()
    const match = html.match(BANDCAMP_ALBUM_ID_REGEX)
    const albumId = match ? match[1] : null

    if (!albumId) {
      return new Response(
        JSON.stringify({ error: "Could not find album ID in Bandcamp page" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ albumId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Bandcamp album ID fetch error:", err)
    return new Response(
      JSON.stringify({ error: "Failed to fetch Bandcamp page" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
