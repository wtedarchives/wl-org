"use client"

import { useEffect, useState } from "react"

import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export type DiscourseFeaturedTopic = {
  id: number
  src: string
  topic: string
  href: string
  posts_count: number
  views: number
}

type FeaturedTopicsApiDebug = {
  latestTopicCount: number
  withFeaturedTagCount: number
  returnedCount: number
  excludedAfterFeatured: Array<{
    id: number | undefined
    slug: string | null
    title: string | null
    reason: "missing_or_invalid_slug" | "missing_id"
  }>
}

type FeaturedTopicsApiResponse = {
  topics?: unknown
  error?: string
  debug?: FeaturedTopicsApiDebug
}

export function useDiscourseFeaturedTopics() {
  const [topics, setTopics] = useState<DiscourseFeaturedTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const base = getSupabaseFunctionsUrl()
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!base || !anon) {
        if (!cancelled) {
          setError("Missing site configuration")
          setLoading(false)
        }
        return
      }

      try {
        const isDev = process.env.NODE_ENV === "development"
        const path = `discourse-featured-topics${isDev ? "?debug=1" : ""}`
        const res = await fetch(`${base}/${path}`, {
          headers: {
            Authorization: `Bearer ${anon}`,
            apikey: anon,
          },
        })
        const data = (await res.json().catch(() => ({}))) as FeaturedTopicsApiResponse
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : `Request failed (${res.status})`,
          )
        }
        if (!cancelled) {
          const raw = Array.isArray(data.topics) ? data.topics : []
          setTopics(
            raw.map((t: DiscourseFeaturedTopic) => ({
              ...t,
              posts_count:
                typeof t.posts_count === "number" ? t.posts_count : 0,
              views: typeof t.views === "number" ? t.views : 0,
            })),
          )
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load featured topics")
          setTopics([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return { topics, loading, error }
}
