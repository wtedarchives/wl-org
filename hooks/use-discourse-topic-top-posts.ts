"use client"

import { useEffect, useState } from "react"

import { parseWlCommunityTopicId } from "@/lib/wl-community-topic-url"
import {
  computeWlTopPostDisplayMode,
  type WlTopPostDisplayMode,
  type WlTopPostExtractionDebug,
} from "@/lib/wl-top-posts-display-debug"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import type { DiscourseEmojiImage } from "@/lib/wl-top-posts-plain-text"

export type DiscourseTopicTopPost = {
  id: number
  username: string
  display_username: string
  avatar_url: string | null
  plain_text: string
  emoji_images?: DiscourseEmojiImage[]
  preview_image_url: string | null
  display_mode: WlTopPostDisplayMode
  extraction_debug?: WlTopPostExtractionDebug
  post_url: string
  score: number
  post_number: number
}

type TopicTopPostsApiResponse = {
  posts?: DiscourseTopicTopPost[]
  error?: string
  message?: string
}

export type UseDiscourseTopicTopPostsResult = {
  posts: DiscourseTopicTopPost[]
  loading: boolean
  /** True when the topic could not be loaded (404, network, config). */
  failed: boolean
  /** True when the topic loaded but has no visible posts to show. */
  empty: boolean
}

const VALID_DISPLAY_MODES = new Set<WlTopPostDisplayMode>([
  "image-only",
  "text-and-image",
  "text-only",
  "empty",
])

function normalizeEmojiImages(
  raw: DiscourseTopicTopPost["emoji_images"],
): DiscourseEmojiImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      const shortcode =
        typeof entry?.shortcode === "string" ? entry.shortcode.trim() : ""
      const src = typeof entry?.src === "string" ? entry.src.trim() : ""
      if (!shortcode || !src) return null
      return { shortcode, src }
    })
    .filter((entry): entry is DiscourseEmojiImage => entry != null)
}

function normalizeTopPost(raw: DiscourseTopicTopPost): DiscourseTopicTopPost {
  const plain_text = typeof raw.plain_text === "string" ? raw.plain_text : ""
  const preview_image_url =
    typeof raw.preview_image_url === "string" && raw.preview_image_url.trim() ?
      raw.preview_image_url.trim()
    : null
  const avatar_url =
    typeof raw.avatar_url === "string" && raw.avatar_url.trim() ?
      raw.avatar_url.trim()
    : null
  const emoji_images = normalizeEmojiImages(raw.emoji_images)
  const display_mode =
    raw.display_mode && VALID_DISPLAY_MODES.has(raw.display_mode) ?
      raw.display_mode
    : computeWlTopPostDisplayMode(preview_image_url, plain_text)

  return {
    ...raw,
    plain_text,
    preview_image_url,
    avatar_url,
    emoji_images,
    display_mode,
    extraction_debug: raw.extraction_debug,
  }
}

export function useDiscourseTopicTopPosts(
  wlLink: string | null | undefined,
): UseDiscourseTopicTopPostsResult {
  const [posts, setPosts] = useState<DiscourseTopicTopPost[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    const trimmed = wlLink?.trim() ?? ""
    const topicId = trimmed ? parseWlCommunityTopicId(trimmed) : null

    if (!topicId) {
      setPosts([])
      setLoading(false)
      setFailed(true)
      setEmpty(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setFailed(false)
    setEmpty(false)
    setPosts([])

    async function run() {
      const base = getSupabaseFunctionsUrl()
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!base || !anon) {
        if (!cancelled) {
          setFailed(true)
          setLoading(false)
        }
        return
      }

      try {
        const res = await fetch(
          `${base}/discourse-topic-top-posts?topic_id=${encodeURIComponent(String(topicId))}`,
          {
            headers: {
              Authorization: `Bearer ${anon}`,
              apikey: anon,
            },
          },
        )
        const data = (await res.json().catch(() => ({}))) as TopicTopPostsApiResponse
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : `Request failed (${res.status})`,
          )
        }
        const raw = Array.isArray(data.posts) ? data.posts : []
        if (!cancelled) {
          if (raw.length === 0) {
            setPosts([])
            setEmpty(true)
          } else {
            const normalized = raw.map((t) =>
              normalizeTopPost(t as DiscourseTopicTopPost),
            )
            setPosts(normalized)
            setEmpty(false)
          }
          setFailed(false)
        }
      } catch {
        if (!cancelled) {
          setPosts([])
          setFailed(true)
          setEmpty(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [wlLink])

  return { posts, loading, failed, empty }
}
