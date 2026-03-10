"use client"

import { useEffect, useState } from "react"

export interface GuestCount {
  guest_id: string
  guest: string
  guest_instrument: string | null
  count: number
}

export interface SongWithGuest {
  entry_song: string
  song_displayname?: string | null
  show_date: string
  show_id: string
  show_venue_location: string
  entry_length: string | null
  entry_short: string | null
  entry_segue: string | null
}

export interface GuestAppearancesModalData {
  isOpen: boolean
  guestId: string
  guestName: string
  guestInstrument: string | null
  songs: SongWithGuest[]
  tourName: string
}

export function useGuestAppearances(
  showIds: string[],
  tourId?: string,
  onDataLoaded?: (hasData: boolean) => void,
) {
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalData, setModalData] = useState<GuestAppearancesModalData>({
    isOpen: false,
    guestId: "",
    guestName: "",
    guestInstrument: null,
    songs: [],
    tourName: "",
  })

  useEffect(() => {
    if (!showIds?.length) {
      setLoading(false)
      onDataLoaded?.(false)
      return
    }

    async function fetchGuestAppearances() {
      try {
        const { supabase } = await import("@/lib/supabase")
        if (!supabase) {
          setLoading(false)
          onDataLoaded?.(false)
          return
        }

        const { data: entriesData, error: entriesError } = await supabase
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_show,
            setlist_entry_guests (
              guest_id,
              guests (
                guest_id,
                guest,
                guest_category,
                guest_instrument
              )
            )
          `,
          )
          .in("entry_show", showIds)

        if (entriesError) throw entriesError

        const guestCountMap: Record<
          string,
          { guest: string; guest_instrument: string | null; count: number }
        > = {}

        for (const entry of entriesData ?? []) {
          const guests = (entry as { setlist_entry_guests?: unknown[] })
            .setlist_entry_guests ?? []
          const nonGoose = guests.filter((seg: { guests?: { guest_category?: string } }) => {
            const cat = seg.guests?.guest_category
            return (
              cat !== "Goose (current)" && cat !== "Goose (former)"
            )
          })
          if (nonGoose.length > 0) {
            for (const seg of nonGoose) {
              const g = (seg as { guests?: { guest_id: string; guest: string; guest_instrument: string | null } }).guests
              if (g) {
                if (!guestCountMap[g.guest_id]) {
                  guestCountMap[g.guest_id] = {
                    guest: g.guest,
                    guest_instrument: g.guest_instrument ?? null,
                    count: 0,
                  }
                }
                guestCountMap[g.guest_id].count++
              }
            }
          }
        }

        const sorted = Object.entries(guestCountMap)
          .map(([guest_id, { guest, guest_instrument, count }]) => ({
            guest_id,
            guest,
            guest_instrument,
            count,
          }))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            return a.guest.localeCompare(b.guest)
          })

        setGuestCounts(sorted)
        onDataLoaded?.(sorted.length > 0)
      } catch (err) {
        console.error("Error fetching guest appearances:", err)
        onDataLoaded?.(false)
      } finally {
        setLoading(false)
      }
    }

    fetchGuestAppearances()
  }, [showIds, onDataLoaded])

  const handleGuestClick = async (
    guestId: string,
    guestName: string,
    guestInstrument: string | null,
  ) => {
    try {
      const { supabase } = await import("@/lib/supabase")
      if (!supabase) return

      let tourName = ""
      if (tourId) {
        const { data } = await supabase
          .from("tours")
          .select("tour")
          .eq("tour_id", tourId)
          .single()
        if (data) tourName = (data as { tour: string }).tour
      }

      const { data, error } = await supabase
        .from("setlist_entries")
        .select(
          `
          entry_song,
          entry_length,
          entry_short,
          entry_segue,
          entry_show,
          entry_set,
          entry_setnum,
          songs:entry_song(song_displayname),
          setlist_entry_guests!inner (
            guest_id
          ),
          shows (
            show_date,
            show_venue_location,
            show_canonid
          )
        `,
        )
        .in("entry_show", showIds)
        .eq("setlist_entry_guests.guest_id", guestId)
        .order("shows(show_canonid)", { ascending: true })
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })

      if (error) throw error

      const songs: SongWithGuest[] = ((data ?? []) as Array<{
        entry_song: string
        entry_length: string | null
        entry_short: string | null
        entry_segue: string | null
        entry_show: string
        songs?: { song_displayname?: string | null } | Array<{ song_displayname?: string | null }>
        shows?: { show_date?: string; show_venue_location?: string } | Array<{ show_date?: string; show_venue_location?: string }>
      }>).map((entry) => {
        const show = Array.isArray(entry.shows) ? entry.shows[0] : entry.shows
        const songsRel = entry.songs
        const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
        return {
          entry_song: entry.entry_song,
          song_displayname: songRow?.song_displayname ?? null,
          show_date: show?.show_date ?? "",
          show_id: entry.entry_show,
          show_venue_location: show?.show_venue_location ?? "",
          entry_length: entry.entry_length,
          entry_short: entry.entry_short,
          entry_segue: entry.entry_segue,
        }
      })

      setModalData({
        isOpen: true,
        guestId,
        guestName,
        guestInstrument,
        songs,
        tourName,
      })
    } catch (err) {
      console.error("Error fetching guest songs:", err)
    }
  }

  return { guestCounts, loading, modalData, setModalData, handleGuestClick }
}
