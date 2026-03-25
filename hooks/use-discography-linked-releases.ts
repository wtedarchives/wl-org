"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { SetlistEntry } from "@/types/setlist"
import type {
  ShowRelease,
  ReleaseToEntriesMap,
} from "@/hooks/use-setlist-releases"

const IN_CHUNK = 500
const PAGE_SIZE = 1000

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

type SortKey = {
  showDate: string
  releaseOrder: number | null
  showId: string
}

function compareSortKeys(a: SortKey, b: SortKey): number {
  const d = a.showDate.localeCompare(b.showDate)
  if (d !== 0) return d
  const ao = a.releaseOrder ?? Number.POSITIVE_INFINITY
  const bo = b.releaseOrder ?? Number.POSITIVE_INFINITY
  if (ao !== bo) return ao - bo
  return a.showId.localeCompare(b.showId)
}

function minSortKey(a: SortKey, b: SortKey): SortKey {
  return compareSortKeys(a, b) <= 0 ? a : b
}

/**
 * Releases tied to discography tracks via `setlist_entry_media`, unique by
 * `release_id`, ordered by earliest contributing show_date then that show's
 * `release_order`.
 */
export function useDiscographyLinkedReleases(
  linkedSetlist: SetlistEntry[],
  enabled: boolean,
) {
  const [releases, setReleases] = useState<ShowRelease[]>([])
  const [releaseToEntriesMap, setReleaseToEntriesMap] =
    useState<ReleaseToEntriesMap>({})
  const [loading, setLoading] = useState(false)

  const setlistRef = useRef(linkedSetlist)
  setlistRef.current = linkedSetlist

  const fetchKey = useMemo(() => {
    if (!enabled || linkedSetlist.length === 0) return ""
    const ids = [...new Set(linkedSetlist.map((e) => e.entry_id))].sort()
    return ids.join(",")
  }, [enabled, linkedSetlist])

  useEffect(() => {
    if (!fetchKey || !supabase) {
      setReleases([])
      setReleaseToEntriesMap({})
      setLoading(false)
      return
    }

    const client = supabase
    const entryShow = new Map<string, string>()
    for (const e of setlistRef.current) {
      entryShow.set(e.entry_id, e.entry_show)
    }
    const allowedEntryIds = new Set(entryShow.keys())

    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        const entryIdList = fetchKey.split(",").filter(Boolean)
        const semRows: { setlist_entry_id: string; release_id: string }[] = []
        for (const chunk of chunkArray(entryIdList, IN_CHUNK)) {
          if (chunk.length === 0) continue
          const { data, error } = await client
            .from("setlist_entry_media")
            .select("setlist_entry_id, release_id")
            .in("setlist_entry_id", chunk)
          if (error) throw error
          for (const row of (data ?? []) as {
            setlist_entry_id: string
            release_id: string
          }[]) {
            if (allowedEntryIds.has(row.setlist_entry_id)) {
              semRows.push(row)
            }
          }
        }

        if (cancelled) return

        if (semRows.length === 0) {
          setReleases([])
          setReleaseToEntriesMap({})
          return
        }

        const releaseIds = [...new Set(semRows.map((r) => r.release_id))]
        const showIds = [
          ...new Set(
            semRows
              .map((r) => entryShow.get(r.setlist_entry_id))
              .filter((id): id is string => !!id),
          ),
        ]

        const showDateById = new Map<string, string>()
        for (const chunk of chunkArray(showIds, IN_CHUNK)) {
          if (chunk.length === 0) continue
          const { data: shows, error: se } = await client
            .from("shows")
            .select("show_id, show_date")
            .in("show_id", chunk)
          if (se) throw se
          for (const s of (shows ?? []) as {
            show_id: string
            show_date: string
          }[]) {
            showDateById.set(s.show_id, s.show_date)
          }
        }

        const rsKey = (showId: string, releaseId: string) =>
          `${showId}\t${releaseId}`
        const orderByShowRelease = new Map<string, number | null>()
        for (const rChunk of chunkArray(releaseIds, IN_CHUNK)) {
          if (rChunk.length === 0) continue
          let page = 0
          let more = true
          while (more) {
            const from = page * PAGE_SIZE
            const to = from + PAGE_SIZE - 1
            const { data: rs, error: rse } = await client
              .from("releases_shows")
              .select("show_id, release_id, release_order")
              .in("show_id", showIds)
              .in("release_id", rChunk)
              .range(from, to)
            if (rse) throw rse
            const rows = (rs ?? []) as {
              show_id: string
              release_id: string
              release_order: number | null
            }[]
            for (const row of rows) {
              orderByShowRelease.set(
                rsKey(row.show_id, row.release_id),
                row.release_order,
              )
            }
            more = rows.length === PAGE_SIZE
            page++
          }
        }

        const sortKeyByRelease = new Map<string, SortKey>()
        const entriesByRelease = new Map<string, Set<string>>()

        for (const row of semRows) {
          const showId = entryShow.get(row.setlist_entry_id)
          if (!showId) continue
          const showDate = showDateById.get(showId) ?? ""
          const ro =
            orderByShowRelease.get(rsKey(showId, row.release_id)) ?? null
          const candidate: SortKey = {
            showDate,
            releaseOrder: ro,
            showId,
          }
          const prev = sortKeyByRelease.get(row.release_id)
          sortKeyByRelease.set(
            row.release_id,
            prev ? minSortKey(prev, candidate) : candidate,
          )
          if (!entriesByRelease.has(row.release_id)) {
            entriesByRelease.set(row.release_id, new Set())
          }
          entriesByRelease.get(row.release_id)!.add(row.setlist_entry_id)
        }

        type RelRow = {
          release_id: string
          release_displayname: string | null
          release_artwork: string | null
          release_link: string | null
          release_service: string | null
        }
        const detailById = new Map<string, RelRow>()
        for (const rChunk of chunkArray(releaseIds, IN_CHUNK)) {
          if (rChunk.length === 0) continue
          const { data: rels, error: relErr } = await client
            .from("releases")
            .select(
              "release_id, release_displayname, release_artwork, release_link, release_service",
            )
            .in("release_id", rChunk)
          if (relErr) throw relErr
          for (const r of (rels ?? []) as RelRow[]) {
            detailById.set(r.release_id, r)
          }
        }

        if (cancelled) return

        const sortedReleaseIds = [...sortKeyByRelease.keys()].sort((a, b) => {
          const ka = sortKeyByRelease.get(a)!
          const kb = sortKeyByRelease.get(b)!
          return compareSortKeys(ka, kb)
        })

        const releaseList: ShowRelease[] = []
        const map: ReleaseToEntriesMap = {}
        for (const rid of sortedReleaseIds) {
          const d = detailById.get(rid)
          if (!d) continue
          const sk = sortKeyByRelease.get(rid)!
          releaseList.push({
            release_id: d.release_id,
            release_displayname: d.release_displayname,
            release_artwork: d.release_artwork,
            release_link: d.release_link,
            release_service: d.release_service,
            release_order: sk.releaseOrder,
          })
          map[rid] = entriesByRelease.get(rid) ?? new Set()
        }

        setReleases(releaseList)
        setReleaseToEntriesMap(map)
      } catch (e) {
        console.error("useDiscographyLinkedReleases:", e)
        if (!cancelled) {
          setReleases([])
          setReleaseToEntriesMap({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchKey])

  const hasReleases = releases.length > 0
  return { releases, releaseToEntriesMap, hasReleases, loading }
}
