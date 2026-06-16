import { corsHeaders } from "../_shared/cors.ts"
import {
  DISCOURSE_TOP_POSTS_CACHE_MAX_AGE_SEC,
  fetchDiscourseTopicTopPosts,
  getDiscourseAuthHeaders,
} from "../_shared/discourse-topic-posts.ts"

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

    const url = new URL(req.url)
    const rawTopicId = url.searchParams.get("topic_id")?.trim()
    const topicId = rawTopicId ? Number.parseInt(rawTopicId, 10) : NaN
    if (!Number.isFinite(topicId) || topicId <= 0) {
      return new Response(JSON.stringify({ error: "Invalid topic_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { headers: authHeaders, configError } = getDiscourseAuthHeaders()
    if (!authHeaders || configError) {
      return new Response(JSON.stringify({ error: "Server configuration error", hint: configError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { posts, cached } = await fetchDiscourseTopicTopPosts(
      topicId,
      authHeaders,
    )

    return new Response(JSON.stringify({ posts, topic_id: topicId, cached }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${DISCOURSE_TOP_POSTS_CACHE_MAX_AGE_SEC}`,
      },
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
