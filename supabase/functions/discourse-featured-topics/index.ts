import { corsHeaders } from "../_shared/cors.ts"

const COMMUNITY_ORIGIN = "https://community.wysterialane.org"
/** Discourse search: topics tagged `featured` (same as `q=tags%3Afeatured`). */
const SEARCH_JSON = `${COMMUNITY_ORIGIN}/search.json?q=${encodeURIComponent("tags:featured")}`

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

type SearchResponse = {
  topics?: DiscourseTopic[]
  topic_list?: { topics?: DiscourseTopic[] }
}

/** Shape of `/t/{id}.json` — `views` and `image_url` live on the root object. */
type TopicShowResponse = {
  id?: number
  views?: number
  image_url?: string | null
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

    const discourseAuthHeaders = {
      "Api-Key": apiKey,
      "Api-Username": apiUsername,
      Accept: "application/json",
    }

    const res = await fetch(SEARCH_JSON, {
      headers: discourseAuthHeaders,
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

    let json: SearchResponse
    try {
      json = (await res.json()) as SearchResponse
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON from Discourse" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const topicRows = json.topics ?? json.topic_list?.topics ?? []
    const byId = new Map<number, DiscourseTopic>()
    for (const t of topicRows) {
      if (typeof t.id !== "number") continue
      if (!byId.has(t.id)) byId.set(t.id, t)
    }
    const raw = Array.from(byId.values())

    const url = new URL(req.url)
    const debugRequested = url.searchParams.has("debug")

    const filtered = raw.filter(
      (t) => typeof t.id === "number" && Boolean(t.slug?.trim()),
    )

    const detailResults = await Promise.all(
      filtered.map(async (t) => {
        try {
          const topicRes = await fetch(
            `${COMMUNITY_ORIGIN}/t/${t.id}.json`,
            { headers: discourseAuthHeaders },
          )
          if (!topicRes.ok) {
            return { image_url: null as string | null, views: 0 }
          }
          const body = (await topicRes.json()) as TopicShowResponse
          const imageUrl =
            typeof body.image_url === "string" && body.image_url.trim() !== "" ?
              body.image_url.trim()
            : null
          const views =
            typeof body.views === "number" && Number.isFinite(body.views) ?
              body.views
            : 0
          return { image_url: imageUrl, views }
        } catch {
          return { image_url: null as string | null, views: 0 }
        }
      }),
    )

    const topics = filtered.map((t, i) => {
      const slug = t.slug!.trim()
      const title =
        t.fancy_title?.trim() ||
        t.title?.trim() ||
        slug.replace(/-/g, " ")
      const detail = detailResults[i]!
      return {
        id: t.id,
        src: detail.image_url ?? DEFAULT_TOPIC_IMAGE,
        topic: title,
        href: `${COMMUNITY_ORIGIN}/t/${slug}/${t.id}`,
        posts_count: typeof t.posts_count === "number" ? t.posts_count : 0,
        views: detail.views,
      }
    })

    const body: {
      topics: typeof topics
      debug?: {
        latestTopicCount: number
        withFeaturedTagCount: number
        returnedCount: number
        /** Topics from search that were dropped (e.g. missing slug). */
        excludedAfterFeatured: Array<{
          id: number | undefined
          slug: string | null
          title: string | null
          reason: "missing_or_invalid_slug" | "missing_id"
        }>
      }
    } = { topics }

    if (debugRequested) {
      const includedIds = new Set(topics.map((t) => t.id))
      const excludedAfterFeatured = raw
        .filter((t) => !includedIds.has(t.id))
        .map((t) => {
          const reason =
            typeof t.id !== "number" ? ("missing_id" as const)
            : ("missing_or_invalid_slug" as const)
          return {
            id: t.id,
            slug: t.slug?.trim() ? t.slug : null,
            title: (t.fancy_title ?? t.title ?? null)?.trim() ?? null,
            reason,
          }
        })

      body.debug = {
        latestTopicCount: raw.length,
        withFeaturedTagCount: raw.length,
        returnedCount: topics.length,
        excludedAfterFeatured,
      }
    }

    return new Response(JSON.stringify(body), {
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
