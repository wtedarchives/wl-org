"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

/**
 * URL of the first poster linked to a show, or null when it has none.
 *
 * Mirrors `loadShowPosterImage` in
 * `supabase/functions/_shared/setlist-share-card/show-poster.ts`, which the
 * server-side renderer uses — `show_posters.show` is jsonb holding an array of
 * show ids, so the lookup is a containment filter rather than an equality one.
 *
 * `enabled` keeps the query off until it is wanted, so a modal does not fetch
 * a poster it may never display.
 */
export function useShowPoster(
  showId: string | undefined,
  enabled = true,
): string | null {
  const [posterUrl, setPosterUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !showId || !supabase) {
      setPosterUrl(null)
      return
    }
    const client = supabase
    let cancelled = false

    async function run() {
      try {
        const { data, error } = await client
          .from("show_posters")
          .select("image")
          .filter("show", "cs", JSON.stringify([showId]))
          .not("image", "is", null)
          .limit(1)
        if (error) throw error
        if (cancelled) return
        const image = (data?.[0]?.image as string | null)?.trim()
        setPosterUrl(image || null)
      } catch (err) {
        console.error("show poster lookup:", err)
        if (!cancelled) setPosterUrl(null)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [showId, enabled])

  return posterUrl
}
