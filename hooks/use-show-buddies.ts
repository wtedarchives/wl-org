"use client"

import { useEffect, useState } from "react"

import {
  fetchShowBuddies,
  type ShowBuddyEntry,
} from "@/lib/show-buddies"

export type { ShowBuddyEntry }

export function useShowBuddies(
  userId: string | null | undefined,
  refetchKey = 0,
) {
  const [buddies, setBuddies] = useState<ShowBuddyEntry[]>([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setBuddies([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchShowBuddies(userId)
      .then((entries) => {
        if (!cancelled) setBuddies(entries)
      })
      .catch((err) => {
        console.error("Error fetching show buddies:", err)
        if (!cancelled) {
          setBuddies([])
          setError("Failed to load show buddies.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, refetchKey])

  return { buddies, loading, error }
}
