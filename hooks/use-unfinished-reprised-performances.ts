"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { isRecordingSessionEmbedShow } from "@/lib/show-recording-session-filter"

export interface UnfinishedReprisedPerformance {
  entry_id: string
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string | null
  venue_id: string | null
  show_subvenue_venue: string | null
}

export function useUnfinishedReprisedPerformances(
  open: boolean,
  songName: string | null,
) {
  const [performances, setPerformances] = useState<
    UnfinishedReprisedPerformance[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !songName) {
      setPerformances([])
      setLoading(false)
      setError(null)
      return
    }

    const client = supabase
    if (!client) {
      setPerformances([])
      return
    }

    let cancelled = false

    async function fetchPerformances(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await sb
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_show,
            shows(
              show_id,
              show_date,
              show_subvenue,
              show_subvenue_venue,
              show_venue_location,
              show_detail,
              subvenues:show_subvenue(
                venues:subvenue_venue(
                  venue_id
                )
              )
            )
          `,
          )
          .eq("entry_song", songName)
          .eq("entry_short", "unfinished")
          .order("entry_show", { ascending: false })

        if (cancelled) return
        if (fetchErr) throw fetchErr

        const rows = (data ?? [])
          .filter(
            (e: { shows?: unknown }) =>
              !isRecordingSessionEmbedShow(
                e.shows as { show_detail?: string | null } | Array<{ show_detail?: string | null }> | null,
              ),
          )
          .map((e: any) => {
          const show = Array.isArray(e.shows) ? e.shows[0] : e.shows
          const sub = Array.isArray(show?.subvenues) ? show?.subvenues[0] : show?.subvenues
          const ven = Array.isArray(sub?.venues) ? sub?.venues?.[0] : sub?.venues
          return {
            entry_id: e.entry_id,
            show_id: show?.show_id ?? e.entry_show,
            show_date: show?.show_date ?? "",
            show_subvenue: show?.show_subvenue ?? "",
            show_venue_location: show?.show_venue_location ?? null,
            venue_id: ven?.venue_id ?? show?.show_subvenue_venue ?? null,
            show_subvenue_venue: show?.show_subvenue_venue ?? null,
          }
        })

        setPerformances(rows)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load performances",
          )
          setPerformances([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPerformances(client)
    return () => {
      cancelled = true
    }
  }, [open, songName])

  return { performances, loading, error }
}
