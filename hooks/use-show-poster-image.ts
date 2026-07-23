"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ShowPosterArtist, ShowPosterRecord } from "@/types/admin"

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const out = value.filter(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  )
  return out.length ? out : null
}

function asArtists(value: unknown): ShowPosterArtist[] | null {
  if (!Array.isArray(value)) return null
  const out: ShowPosterArtist[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const name = typeof row.name === "string" ? row.name : ""
    const link = typeof row.link === "string" ? row.link : ""
    if (!name.trim() && !link.trim()) continue
    out.push({ name, link })
  }
  return out.length ? out : null
}

function normalizePosterRow(row: Record<string, unknown>): ShowPosterRecord | null {
  const uuid = typeof row.uuid === "string" ? row.uuid : ""
  if (!uuid) return null
  const image =
    typeof row.image === "string" && row.image.trim() ? row.image.trim() : null
  if (!image) return null

  const printRaw = row.print_run
  let print_run: number | null = null
  if (typeof printRaw === "number" && Number.isFinite(printRaw)) {
    print_run = printRaw
  } else if (typeof printRaw === "string" && printRaw.trim() !== "") {
    const n = Number.parseInt(printRaw, 10)
    if (!Number.isNaN(n)) print_run = n
  }

  return {
    uuid,
    show: asStringArray(row.show),
    tour: asStringArray(row.tour),
    artist: asArtists(row.artist),
    print_run,
    description:
      typeof row.description === "string" && row.description.trim() ?
        row.description.trim()
      : null,
    image,
  }
}

/**
 * `show_posters` rows whose jsonb `show` array contains this show_id and that have an image.
 */
export function useShowPosters(showId: string | undefined): ShowPosterRecord[] {
  const [posters, setPosters] = useState<ShowPosterRecord[]>([])

  useEffect(() => {
    if (!showId || !supabase) {
      setPosters([])
      return
    }
    const client = supabase
    let cancelled = false

    void (async () => {
      // jsonb `cs` needs a JSON array (`["uuid"]`), not Postgres `{uuid}` from `.contains([...])`.
      const { data, error } = await client
        .from("show_posters")
        .select("uuid, show, tour, artist, print_run, description, image")
        .filter("show", "cs", JSON.stringify([showId]))
        .not("image", "is", null)

      if (cancelled) return
      if (error) {
        console.error(
          "Error fetching show posters:",
          error.message,
          error.code,
          error.details,
        )
        setPosters([])
        return
      }

      const next: ShowPosterRecord[] = []
      const seen = new Set<string>()
      for (const raw of data ?? []) {
        const row = normalizePosterRow(raw as Record<string, unknown>)
        if (!row || seen.has(row.uuid)) continue
        seen.add(row.uuid)
        next.push(row)
      }
      setPosters(next)
    })()

    return () => {
      cancelled = true
    }
  }, [showId])

  return posters
}

/** Image URLs only — convenience wrapper around {@link useShowPosters}. */
export function useShowPosterImages(showId: string | undefined): string[] {
  return useShowPosters(showId)
    .map((p) => p.image)
    .filter((u): u is string => Boolean(u?.trim()))
}
