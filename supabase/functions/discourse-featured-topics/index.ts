import { corsHeaders } from "../_shared/cors.ts"

const COMMUNITY_ORIGIN = "https://community.wysterialane.org"
const LATEST_JSON = `${COMMUNITY_ORIGIN}/latest.json`

/** Local fallback when Discourse has no topic image (matches prior static featured assets). */
const DEFAULT_TOPIC_IMAGE = "/featured-1.jpg"

type DiscourseTag = { name?: string; slug?: string }

type DiscourseTopic = {
  id: number
  slug?: string
  title?: string
  fancy_title?: string
  image_url?: string | null
  tags?: DiscourseTag[]
  posts_count?: number
  views?: number
}

type LatestResponse = {
  topic_list?: { topics?: DiscourseTopic[] }
}

function hasFeaturedTag(tags: DiscourseTag[] | undefined): boolean {
  if (!Array.isArray(tags)) return false
  return tags.some(
    (t) => t.name === "featured" || t.slug === "featured",
  )
}

/**
 * Do not re-check the anon JWT here: Supabase validates `Authorization` / `apikey`
 * at the edge before this handler runs, and those headers are often not forwarded
 * to the function body in a form we can compare to `SUPABASE_ANON_KEY`.
 */
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

    const apiKey = Deno.env.get("DISCOURSE_API_KEY")?.trim()
    const apiUsername = Deno.env.get("DISCOURSE_API_USERNAME")?.trim()

    if (!apiKey || !apiUsername) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          hint:
            "supabase secrets set DISCOURSE_API_KEY=... DISCOURSE_API_USERNAME=... && supabase functions deploy discourse-featured-topics",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const res = await fetch(LATEST_JSON, {
      headers: {
        "Api-Key": apiKey,
        "Api-Username": apiUsername,
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(
        JSON.stringify({
          error: `Discourse returned ${res.status}`,
          detail: text.slice(0, 300),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    let json: LatestResponse
    try {
      json = (await res.json()) as LatestResponse
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON from Discourse" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const raw = json.topic_list?.topics ?? []

    const topics = raw
      .filter((t) => hasFeaturedTag(t.tags))
      .filter((t) => typeof t.id === "number" && Boolean(t.slug?.trim()))
      .map((t) => {
        const slug = t.slug!.trim()
        const title =
          t.fancy_title?.trim() ||
          t.title?.trim() ||
          slug.replace(/-/g, " ")
        return {
          id: t.id,
          src: t.image_url?.trim() || DEFAULT_TOPIC_IMAGE,
          topic: title,
          href: `${COMMUNITY_ORIGIN}/t/${slug}/${t.id}`,
          posts_count: typeof t.posts_count === "number" ? t.posts_count : 0,
          views: typeof t.views === "number" ? t.views : 0,
        }
      })

    return new Response(JSON.stringify({ topics }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return new Response(
      JSON.stringify({ error: "Unhandled function error", message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
