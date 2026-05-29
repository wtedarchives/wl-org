"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getSetlistCombinedRowExpandKeys } from "@/lib/song-pairs"
import type { SetlistEntry } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

export function useSetlistPairExpansion(
  showId: string,
  options: {
    expandCombinedOnLoad: boolean
    setlist: SetlistEntry[]
    songPairs: SongPair[]
  },
) {
  const { expandCombinedOnLoad, setlist, songPairs } = options
  const [expandedPairKeys, setExpandedPairKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [expandedCoachNoteEntryIds, setExpandedCoachNoteEntryIds] = useState<
    Set<string>
  >(() => new Set())
  const seededShowIdRef = useRef<string | null>(null)

  useEffect(() => {
    seededShowIdRef.current = null
    setExpandedPairKeys(new Set())
    setExpandedCoachNoteEntryIds(new Set())
  }, [showId])

  useEffect(() => {
    if (seededShowIdRef.current === showId) return
    if (setlist.length === 0) return
    seededShowIdRef.current = showId
    setExpandedPairKeys(
      expandCombinedOnLoad ?
        getSetlistCombinedRowExpandKeys(setlist, songPairs)
      : new Set(),
    )
    setExpandedCoachNoteEntryIds(new Set())
  }, [showId, setlist, songPairs, expandCombinedOnLoad])

  useEffect(() => {
    if (seededShowIdRef.current !== showId || setlist.length === 0) return
    setExpandedPairKeys(
      expandCombinedOnLoad ?
        getSetlistCombinedRowExpandKeys(setlist, songPairs)
      : new Set(),
    )
  }, [expandCombinedOnLoad, showId, setlist, songPairs])

  const expandPair = useCallback((expandKey: string) => {
    setExpandedPairKeys((prev) => {
      const next = new Set(prev)
      next.add(expandKey)
      return next
    })
  }, [])

  const expandPairFromCoachNotes = useCallback(
    (expandKey: string, entries: SetlistEntry[]) => {
      setExpandedPairKeys((prev) => {
        const next = new Set(prev)
        next.add(expandKey)
        return next
      })
      setExpandedCoachNoteEntryIds((prev) => {
        const next = new Set(prev)
        for (const entry of entries) {
          if (entry.entry_coachnotes?.trim()) {
            next.add(entry.entry_id)
          }
        }
        return next
      })
    },
    [],
  )

  const isCoachNotesExpanded = useCallback(
    (entryId: string) => expandedCoachNoteEntryIds.has(entryId),
    [expandedCoachNoteEntryIds],
  )

  return {
    expandedPairKeys,
    expandPair,
    expandPairFromCoachNotes,
    isCoachNotesExpanded,
  }
}
