"use client"

import { useCallback, useEffect, useState } from "react"

import type { SetlistEntry } from "@/types/setlist"

export function useSetlistPairExpansion(showId: string) {
  const [expandedPairKeys, setExpandedPairKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [expandedCoachNoteEntryIds, setExpandedCoachNoteEntryIds] = useState<
    Set<string>
  >(() => new Set())

  useEffect(() => {
    setExpandedPairKeys(new Set())
    setExpandedCoachNoteEntryIds(new Set())
  }, [showId])

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
