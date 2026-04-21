"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

/** Same upcoming/past split as {@link useShowsData} / {@link useWlHomeMostRecentShow}. */
function localTomorrowDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export type UserCanonicalBookendShow = {
  show_id: string
  show_date: string
  show_detail: string | null
  show_venue_location: string
}

type ShowRow = UserCanonicalBookendShow & {
  show_group: string
  show_canonid: string | null
}

/** Primary line for profile tile / archive-style headers. */
export function wlHomeProfileBookendTitle(show: UserCanonicalBookendShow): string {
  const d = show.show_detail?.trim()
  return d || show.show_venue_location
}

function comparePastDesc(a: ShowRow, b: ShowRow): number {
  const byDate = b.show_date.localeCompare(a.show_date)
  if (byDate !== 0) return byDate
  const ac = a.show_canonid ?? ""
  const bc = b.show_canonid ?? ""
  const byCanon = ac.localeCompare(bc)
  if (byCanon !== 0) return byCanon
  return (a.show_group ?? "").localeCompare(b.show_group ?? "")
}

function compareUpcomingAsc(a: ShowRow, b: ShowRow): number {
  const byDate = a.show_date.localeCompare(b.show_date)
  if (byDate !== 0) return byDate
  const ac = a.show_canonid ?? ""
  const bc = b.show_canonid ?? ""
  const byCanon = ac.localeCompare(bc)
  if (byCanon !== 0) return byCanon
  return (a.show_group ?? "").localeCompare(b.show_group ?? "")
}

async function fetchAllAttendedShowIds(userId: string): Promise<string[]> {
  const client = supabase
  if (!client) return []

  const ids: string[] = []
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await client
      .from("user_attended_shows")
      .select("show_id")
      .eq("user_id", userId)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw error
    if (data && data.length > 0) {
      ids.push(...data.map((r) => r.show_id as string))
      page++
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }
  return ids
}

async function fetchShowRows(showIds: string[]): Promise<ShowRow[]> {
  const client = supabase
  if (!client || showIds.length === 0) return []

  const chunks: string[][] = []
  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    chunks.push(showIds.slice(i, i + CHUNK_SIZE))
  }

  const out: ShowRow[] = []
  for (const chunk of chunks) {
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("shows")
        .select(
          "show_id, show_date, show_group, show_canonid, show_detail, show_venue_location",
        )
        .in("show_id", chunk)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      if (data && data.length > 0) {
        out.push(...(data as ShowRow[]))
        page++
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
  }
  return out
}

function toPublic(r: ShowRow): UserCanonicalBookendShow {
  return {
    show_id: r.show_id,
    show_date: r.show_date,
    show_detail: r.show_detail,
    show_venue_location: r.show_venue_location,
  }
}

/**
 * Latest past and earliest upcoming **canonical Goose** shows the user has marked
 * attended — same ordering tie-breakers as {@link useShowsData} (date, canon id, group).
 */
export function useUserCanonicalBookendShows(userId: string | null) {
  const [lastShow, setLastShow] = useState<UserCanonicalBookendShow | null>(
    null,
  )
  const [nextShow, setNextShow] = useState<UserCanonicalBookendShow | null>(
    null,
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !supabase) {
      setLastShow(null)
      setNextShow(null)
      setLoading(false)
      return
    }

    const uid = userId
    let cancelled = false

    async function run() {
      setLoading(true)
      try {
        const attendedIds = await fetchAllAttendedShowIds(uid)
        if (!attendedIds.length || cancelled) {
          if (!cancelled) {
            setLastShow(null)
            setNextShow(null)
          }
          return
        }

        const rows = await fetchShowRows(attendedIds)
        if (cancelled) return

        const canon = rows.filter(
          (s) => s.show_group === "Goose" && s.show_canonid,
        )
        const tomorrow = localTomorrowDateString()
        const past = canon.filter((s) => s.show_date < tomorrow)
        const future = canon.filter((s) => s.show_date >= tomorrow)

        past.sort(comparePastDesc)
        future.sort(compareUpcomingAsc)

        if (!cancelled) {
          setLastShow(past[0] ? toPublic(past[0]) : null)
          setNextShow(future[0] ? toPublic(future[0]) : null)
        }
      } catch {
        if (!cancelled) {
          setLastShow(null)
          setNextShow(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [userId])

  return { lastShow, nextShow, loading }
}
