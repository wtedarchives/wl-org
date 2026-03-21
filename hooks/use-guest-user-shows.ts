"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const CHUNK_SIZE = 200

export interface GuestUserShow {
  show_id: string
  show_date: string
  show_tour: string | null
  show_venue_location: string
  show_group: string
  tour_id: string | null
  venue_id: string | null
}

export function useGuestUserShows(
  open: boolean,
  guestId: string | null,
  attendedShowIds: string[]
) {
  const [shows, setShows] = useState<GuestUserShow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (
      !open ||
      !guestId ||
      attendedShowIds.length === 0 ||
      !supabase
    ) {
      setShows([])
      setLoading(false)
      setError(null)
      return
    }

    async function fetchShows() {
      const client = supabase
      if (!client) return

      try {
        setLoading(true)
        setError(null)

        const showsMap = new Map<string, GuestUserShow>()
        const attendedChunks: string[][] = []
        for (let i = 0; i < attendedShowIds.length; i += CHUNK_SIZE) {
          attendedChunks.push(attendedShowIds.slice(i, i + CHUNK_SIZE))
        }

        const results = await Promise.all(
          attendedChunks.map((chunk) =>
            client
              .from("setlist_entries")
              .select(
                `
                entry_show,
                shows!inner(
                  show_id,
                  show_date,
                  show_tour,
                  show_venue_location,
                  show_group,
                  tours!show_tour(tour_id),
                  subvenues:show_subvenue(
                    venues:subvenue_venue(
                      venue_id
                    )
                  )
                ),
                setlist_entry_guests!inner(guest_id)
              `
              )
              .in("entry_show", chunk)
              .eq("setlist_entry_guests.guest_id", guestId)
          )
        )

        for (const { data: entries, error: entriesError } of results) {
          if (entriesError) throw entriesError

          for (const row of entries ?? []) {
            const showsRel = row.shows as
              | {
                  show_id: string
                  show_date: string
                  show_tour: string | null
                  show_venue_location: string
                  show_group: string
                  tours?: { tour_id: string } | { tour_id: string }[] | null
                  subvenues?:
                    | { venues?: { venue_id: string } }
                    | { venues?: { venue_id: string } }[]
                    | null
                }
              | {
                  show_id: string
                  show_date: string
                  show_tour: string | null
                  show_venue_location: string
                  show_group: string
                  tours?: { tour_id: string } | { tour_id: string }[] | null
                  subvenues?:
                    | { venues?: { venue_id: string } }
                    | { venues?: { venue_id: string } }[]
                    | null
                }[]

            const showRaw = Array.isArray(showsRel) && showsRel.length > 0
              ? showsRel[0]
              : showsRel
            const show = Array.isArray(showRaw)
              ? null
              : (showRaw as {
                  show_id: string
                  show_date: string
                  show_tour: string | null
                  show_venue_location: string
                  show_group: string
                  tours?: { tour_id: string } | { tour_id: string }[] | null
                  subvenues?:
                    | { venues?: { venue_id: string } }
                    | { venues?: { venue_id: string } }[]
                    | null
                })

            if (!show) continue
            if (showsMap.has(show.show_id)) continue

            const tourId =
              Array.isArray(show.tours) && show.tours[0]
                ? show.tours[0].tour_id
                : (show.tours as { tour_id: string } | undefined)?.tour_id ??
                  null

            const subvenuesVal = show.subvenues
            const venueId =
              (Array.isArray(subvenuesVal)
                ? subvenuesVal[0]?.venues?.venue_id
                : (subvenuesVal as { venues?: { venue_id: string } } | undefined)
                    ?.venues?.venue_id) ?? null

            showsMap.set(show.show_id, {
              show_id: show.show_id,
              show_date: show.show_date,
              show_tour: show.show_tour ?? null,
              show_venue_location: show.show_venue_location ?? "",
              show_group: show.show_group ?? "",
              tour_id: tourId,
              venue_id: venueId,
            })
          }
        }

        const result = Array.from(showsMap.values()).sort((a, b) =>
          a.show_date.localeCompare(b.show_date)
        )
        setShows(result)
      } catch (err) {
        console.error("Error fetching guest user shows:", err)
        setError("Unable to load shows.")
        setShows([])
      } finally {
        setLoading(false)
      }
    }

    fetchShows()
  }, [open, guestId, attendedShowIds.join(",")])

  return { shows, loading, error }
}
