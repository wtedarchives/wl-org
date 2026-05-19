import { corsHeaders } from "../_shared/cors.ts"

/** Cap proxy response size (bytes). */
const MAX_BODY_BYTES = 8 * 1024 * 1024

function isAllowedUpstream(url: URL): boolean {
  if (url.protocol !== "https:") return false
  const h = url.hostname.toLowerCase()
  if (h === "radio.co" || h.endsWith(".radio.co")) return true
  if (h.endsWith(".supabase.co")) {
    const p = url.pathname
    return (
      p.startsWith("/storage/v1/object/") ||
      p.startsWith("/storage/v1/render/")
    )
  }
  return false
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const reqUrl = new URL(req.url)
    const rawParam = reqUrl.searchParams.get("url")
    if (!rawParam?.trim()) {
      return new Response(JSON.stringify({ error: "Missing url query parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let target: URL
    try {
      target = new URL(rawParam.trim())
    } catch {
      return new Response(JSON.stringify({ error: "Invalid url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!isAllowedUpstream(target)) {
      return new Response(JSON.stringify({ error: "URL host not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const upstreamRes = await fetch(target.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent": "wl-org-schedule-share-image-proxy/1.0",
        "Accept": "image/*,*/*;q=0.8",
      },
    })

    if (!upstreamRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Upstream fetch failed",
          status: upstreamRes.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    let finalUrl: URL
    try {
      finalUrl = new URL(upstreamRes.url)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid upstream redirect URL" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!isAllowedUpstream(finalUrl)) {
      return new Response(JSON.stringify({ error: "Redirect left allowlist" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const lenHeader = upstreamRes.headers.get("content-length")
    if (lenHeader) {
      const n = Number(lenHeader)
      if (Number.isFinite(n) && n > MAX_BODY_BYTES) {
        return new Response(JSON.stringify({ error: "Image too large" }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    const buf = new Uint8Array(await upstreamRes.arrayBuffer())
    if (buf.byteLength > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const ct =
      upstreamRes.headers.get("content-type")?.split(";")[0]?.trim() ||
      "application/octet-stream"

    return new Response(buf, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": ct,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("schedule-share-image-proxy", message)
    return new Response(JSON.stringify({ error: "Proxy error", message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
