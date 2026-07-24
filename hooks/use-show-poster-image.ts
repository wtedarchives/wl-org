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

const TOUR_POSTERS_PAGE = 1000
const SHOW_META_PAGE = 1000

export type TourPosterRecord = ShowPosterRecord & {
  /** Linked shows as `mm.dd.yy (venue_location)`, earliest first. */
  showLabels: string[]
}

/**
 * Posters linked to this tour by name (`tour` jsonb) and/or by any of the tour's show IDs.
 * Order: no show association first, then chronological by earliest linked show_date.
 * Returns `null` while loading so the UI can stay hidden until we know whether any exist.
 */
export function useTourPosters(
  tourName: string | undefined,
  showIds: string[],
): TourPosterRecord[] | null {
  const [posters, setPosters] = useState<TourPosterRecord[] | null>(null)
  const showIdsKey = showIds.join(",")

  useEffect(() => {
    const name = tourName?.trim() ?? ""
    const ids = showIdsKey
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    if ((!name && ids.length === 0) || !supabase) {
      setPosters([])
      return
    }
    const client = supabase
    let cancelled = false
    setPosters(null)

    void (async () => {
      try {
        const all: ShowPosterRecord[] = []
        const seen = new Set<string>()
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data, error } = await client
            .from("show_posters")
            .select("uuid, show, tour, artist, print_run, description, image")
            .not("image", "is", null)
            .range(page * TOUR_POSTERS_PAGE, (page + 1) * TOUR_POSTERS_PAGE - 1)
          if (error) throw error
          if (data?.length) {
            for (const raw of data) {
              const row = normalizePosterRow(raw as Record<string, unknown>)
              if (!row || seen.has(row.uuid)) continue
              seen.add(row.uuid)
              all.push(row)
            }
            page++
            hasMore = data.length === TOUR_POSTERS_PAGE
          } else {
            hasMore = false
          }
        }

        if (cancelled) return

        const idSet = new Set(ids)
        const nameLower = name.toLowerCase()
        const matched = all.filter((row) => {
          if (
            nameLower &&
            row.tour?.some((t) => t.trim().toLowerCase() === nameLower)
          ) {
            return true
          }
          if (row.show?.some((id) => idSet.has(id))) return true
          return false
        })

        const linkedShowIds = [
          ...new Set(
            matched.flatMap((row) => row.show ?? []).filter(Boolean),
          ),
        ]

        const showMeta = new Map<
          string,
          { show_date: string; show_venue_location: string | null }
        >()
        for (let i = 0; i < linkedShowIds.length; i += SHOW_META_PAGE) {
          const chunk = linkedShowIds.slice(i, i + SHOW_META_PAGE)
          const { data, error } = await client
            .from("shows")
            .select("show_id, show_date, show_venue_location")
            .in("show_id", chunk)
          if (error) throw error
          for (const row of data ?? []) {
            const id = typeof row.show_id === "string" ? row.show_id : ""
            if (!id) continue
            showMeta.set(id, {
              show_date:
                typeof row.show_date === "string" ? row.show_date : "",
              show_venue_location:
                typeof row.show_venue_location === "string" ?
                  row.show_venue_location
                : null,
            })
          }
        }

        if (cancelled) return

        const { formatSetlistDate } = await import("@/lib/setlist-utils")

        const enriched: TourPosterRecord[] = matched.map((row) => {
          const showEntries = (row.show ?? [])
            .map((id) => {
              const meta = showMeta.get(id)
              if (!meta?.show_date) return null
              const date = formatSetlistDate(meta.show_date)
              if (!date) return null
              const venue = meta.show_venue_location?.trim() ?? ""
              return {
                dateKey: meta.show_date,
                label: venue ? `${date} (${venue})` : date,
              }
            })
            .filter((x): x is { dateKey: string; label: string } => x != null)
            .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

          return {
            ...row,
            showLabels: showEntries.map((e) => e.label),
          }
        })

        enriched.sort((a, b) => {
          const aHas = (a.show?.length ?? 0) > 0
          const bHas = (b.show?.length ?? 0) > 0
          if (!aHas && bHas) return -1
          if (aHas && !bHas) return 1
          if (!aHas && !bHas) return 0

          const earliest = (p: TourPosterRecord) => {
            let min: string | null = null
            for (const id of p.show ?? []) {
              const d = showMeta.get(id)?.show_date
              if (!d) continue
              if (min == null || d < min) min = d
            }
            return min
          }
          const aDate = earliest(a)
          const bDate = earliest(b)
          if (aDate == null && bDate == null) return 0
          if (aDate == null) return 1
          if (bDate == null) return -1
          return aDate.localeCompare(bDate)
        })

        setPosters(enriched)
      } catch (e) {
        console.error("Error fetching tour posters:", e)
        if (!cancelled) setPosters([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tourName, showIdsKey])

  return posters
}

/** Image URLs only — convenience wrapper around {@link useShowPosters}. */
export function useShowPosterImages(showId: string | undefined): string[] {
  return useShowPosters(showId)
    .map((p) => p.image)
    .filter((u): u is string => Boolean(u?.trim()))
}
