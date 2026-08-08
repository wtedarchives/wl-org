"use client"

import { useCallback, useState } from "react"

import {
  fetchSetlistAttendees,
  type SetlistAttendeeEntry,
} from "@/lib/setlist-attendees"
import type { Show } from "@/types/setlist"

export type { SetlistAttendeeEntry }

export function useSetlistAttendees(
  showId: string | undefined,
  show: Show | null,
) {
  const [attendees, setAttendees] = useState<SetlistAttendeeEntry[]>([])
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)

  const showGroup = show?.show_group ?? null
  const showCanonid = show?.show_canonid ?? null
  const showDetail = show?.show_detail ?? null

  const fetchAttendees = useCallback(async () => {
    if (!showId) return
    setIsLoadingAttendees(true)
    setAttendeesError(null)
    try {
      const entries = await fetchSetlistAttendees(showId, {
        show_group: showGroup,
        show_canonid: showCanonid,
        show_detail: showDetail,
      })
      setAttendees(entries)
    } catch (err) {
      console.error("Error fetching setlist attendees:", err)
      setAttendeesError("Failed to load attendees.")
      setAttendees([])
    } finally {
      setIsLoadingAttendees(false)
    }
  }, [showId, showGroup, showCanonid, showDetail])

  return {
    attendees,
    isLoadingAttendees,
    attendeesError,
    fetchAttendees,
  }
}
