"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Show, SetlistEntry, ShowDate } from "@/types/setlist"

function formatShowDateUtc(dateString: string): string {
  const date = new Date(dateString + "T00:00:00Z")
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
  return `${month}.${day}.${year}`
}

export interface Tour {
  tour: string
  tour_canonid: number
  tour_id: string
}

export function useSetlistData(showId: string | undefined) {
  const [show, setShow] = useState<Show | null>(null)
  const [setlist, setSetlist] = useState<SetlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showLengthRank, setShowLengthRank] = useState<number | null>(null)

  useEffect(() => {
    if (!showId || !supabase) {
      setLoading(false)
      return
    }
    const client = supabase

    async function fetchSetlist() {
      try {
        const { data: showData, error: showError } = await client
          .from("shows")
          .select(
            `
            show_id,
            show_date,
            show_group,
            show_tour,
            show_subvenue,
            show_venue_location,
            show_detail,
            show_alert,
            show_coachnotes,
            show_canonid,
            show_callbacks,
            show_wl_link,
            show_subvenue_venue,
            rating_visibility,
            show_rarity,
            show_gap,
            show_length,
            show_listcategorycomplete,
            show_jivecomplete,
            show_dripfieldcomplete,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            tours!inner(tour_showfields, tour_id)
          `
          )
          .eq("show_id", showId)
          .single()

        if (showError) throw showError

        const toursRaw = showData?.tours as
          | { tour_showfields: boolean; tour_id: string }
          | { tour_showfields: boolean; tour_id: string }[]
          | undefined
        const tourRow = Array.isArray(toursRaw) ? toursRaw[0] : toursRaw
        const subvenuesRow = showData?.subvenues as
          | { venues?: { venue_id: string } }
          | undefined

        setShow({
          ...showData,
          show_tour: showData.show_tour ?? null,
          tour_showfields: tourRow?.tour_showfields ?? false,
          show_callbacks: showData.show_callbacks ?? null,
          tour_id: tourRow?.tour_id ?? "",
          venue_id: subvenuesRow?.venues?.venue_id ?? undefined,
        } as Show)

        const { data: setlistData, error: setlistError } = await client
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_set,
            entry_setnum,
            entry_song,
            entry_short,
            entry_segue,
            entry_length,
            entry_placement,
            entry_coachnotes,
            entry_setorder,
            entry_show,
            radio_id,
            song_tour_count,
            last_count,
            last_show_id,
            last_show_tour,
            last_show_subvenue,
            last_venue,
            last_venue_location,
            last_show_date,
            times_played,
            shows_since_debut,
            song_rarity_percentage,
            times_played_num,
            shows_since_debut_num,
            songs (
              song_id,
              song_category,
              song_originalartist,
              categories (
                category_canonid
              )
            ),
            setlist_entry_guests(
              guest_id,
              guests(
                guest_displayname,
                guest_canonid,
                guest_instrument,
                guest_category
              )
            ),
            joty_results (
              round_achieved
            )
          `
          )
          .eq("entry_show", showId)
          .order("entry_set", { ascending: true })
          .order("entry_setnum", { ascending: true })

        if (setlistError) throw setlistError

        const processedSetlist = (setlistData ?? []).map((entry: Record<string, unknown>) => {
          const songs = entry.songs as
            | { song_id: string; song_category: string; song_originalartist: string | null; categories: { category_canonid: number } }
            | undefined
          const guestsRaw = entry.setlist_entry_guests as
            | Array<{ guest_id: string; guests: { guest_displayname: string; guest_canonid: number; guest_instrument: string; guest_category?: string | null } }>
            | undefined
          const jotyResults = entry.joty_results as { round_achieved: string | null } | undefined
          return {
            ...entry,
            song_id: songs?.song_id ?? "",
            song_category: songs?.song_category ?? "",
            category_canonid: songs?.categories?.category_canonid ?? 0,
            times_played_num:
              entry.times_played_num != null
                ? Number(entry.times_played_num)
                : null,
            shows_since_debut_num:
              entry.shows_since_debut_num != null
                ? Number(entry.shows_since_debut_num)
                : null,
            joty_round: jotyResults?.round_achieved ?? null,
            guests:
              guestsRaw?.map((g) => ({
                guest_id: g.guest_id,
                guest_display_name: g.guests.guest_displayname,
                guest_canonid: g.guests.guest_canonid,
                guest_instrument: g.guests.guest_instrument,
                guest_category: g.guests.guest_category ?? null,
              })) ?? [],
            songs: songs
              ? {
                  ...songs,
                  song_originalartist: songs.song_originalartist ?? null,
                  categories: {
                    category_canonid: songs.categories?.category_canonid ?? 0,
                    category_artwork: null,
                  },
                }
              : {
                  song_id: "",
                  song_category: "",
                  song_originalartist: null,
                  categories: { category_canonid: 0, category_artwork: null },
                },
          }
        }) as SetlistEntry[]

        setSetlist(processedSetlist)
      } catch (err) {
        console.error("Error fetching setlist:", err)
        setShow(null)
        setSetlist([])
      } finally {
        setLoading(false)
      }
    }

    fetchSetlist()
  }, [showId])

  useEffect(() => {
    if (!showId || !show?.show_canonid || !supabase) return
    const client = supabase

    async function fetchShowLengthRank() {
      try {
        const { data: showsData, error } = await client
          .from("shows")
          .select("show_id, show_length")
          .not("show_canonid", "is", null)
          .not("show_length", "is", null)

        if (error) throw error

        const timeToSeconds = (timeStr: string) => {
          const parts = timeStr.split(":").map(Number)
          if (parts.length === 3)
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
          if (parts.length === 2) return parts[0] * 60 + parts[1]
          return 0
        }

        const showsWithSeconds = (showsData ?? [])
          .map((s: { show_id: string; show_length: string }) => ({
            show_id: s.show_id,
            total_seconds: timeToSeconds(s.show_length),
          }))
          .sort(
            (a: { total_seconds: number }, b: { total_seconds: number }) =>
              b.total_seconds - a.total_seconds
          )

        const rankIndex = showsWithSeconds.findIndex(
          (s: { show_id: string }) => s.show_id === showId
        )
        if (rankIndex !== -1 && rankIndex < 25) {
          setShowLengthRank(rankIndex + 1)
        } else {
          setShowLengthRank(null)
        }
      } catch (err) {
        console.error("Error fetching show length rank:", err)
        setShowLengthRank(null)
      }
    }

    fetchShowLengthRank()
  }, [showId, show?.show_canonid])

  return { show, setlist, loading, showLengthRank }
}

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    async function fetchTours() {
      try {
        const { data, error } = await client
          .from("tours")
          .select("tour, tour_canonid, tour_id")
          .order("tour_canonid", { ascending: true })
        if (error) throw error
        setTours((data as Tour[]) ?? [])
      } catch (err) {
        console.error("Error fetching tours:", err)
      }
    }
    fetchTours()
  }, [])

  return { tours }
}

export function useShowDates(show: Show | null, showId: string | undefined) {
  const [showDates, setShowDates] = useState<ShowDate[]>([])

  useEffect(() => {
    if (!show?.show_tour || !supabase) {
      setShowDates([])
      return
    }
    const client = supabase
    const tourName = show.show_tour

    async function fetchShowDates() {
      setShowDates([])
      try {
        const { data, error } = await client
          .from("shows")
          .select(
            `
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_venue_location,
            show_canonid,
            subvenues (
              subvenue_venue,
              venues (
                venue_location
              )
            )
          `
          )
          .eq("show_tour", tourName)
          .order("show_date", { ascending: true })

        if (error) throw error

        const sortedShows = (data ?? []).sort(
          (a: { show_date: string; show_canonid: number | null; show_group: string }, b: { show_date: string; show_canonid: number | null; show_group: string }) => {
            const dateA = new Date(a.show_date).getTime()
            const dateB = new Date(b.show_date).getTime()
            if (dateA !== dateB) return dateA - dateB
            const aHasCanonid = a.show_canonid !== null
            const bHasCanonid = b.show_canonid !== null
            if (aHasCanonid && bHasCanonid)
              return a.show_canonid! - b.show_canonid!
            if (aHasCanonid && !bHasCanonid) return -1
            if (!aHasCanonid && bHasCanonid) return 1
            return (a.show_group ?? "").localeCompare(b.show_group ?? "")
          }
        )

        const processed = sortedShows.map(
          (s: {
            show_id: string
            show_date: string
            show_group: string
            show_subvenue: string
            show_venue_location: string | null
            show_detail: string | null
            show_alert: string | null
            show_canonid: number | null
          }) => ({
            show_id: s.show_id,
            show_date: s.show_date,
            formatted_show_date: formatShowDateUtc(s.show_date),
            show_group: s.show_group,
            show_subvenue: s.show_subvenue,
            show_venue_location: s.show_venue_location,
            show_detail: s.show_detail,
            show_alert: s.show_alert,
            show_rarity_percentage: null,
            total_entry_length: null,
            show_canonid: s.show_canonid,
          })
        )
        setShowDates(processed as ShowDate[])
      } catch (err) {
        console.error("Error fetching show dates:", err)
      }
    }

    fetchShowDates()
  }, [show?.show_tour, showId])

  return { showDates }
}
