"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"

export interface ListShow {
  show_id: string
  show_date: string
  show_group: string
  show_tour: string
  tour_id: string | null
  show_subvenue: string
  show_venue_location: string
  show_detail: string | null
  show_alert: string | null
  show_wl_link: string | null
  venue_id: string | null
  show_subvenue_venue?: string | null
  show_length: string
  show_rarity: string | null
  show_gap: string | null
  show_listcategorycomplete?: string
}

export function useListShowData(shows: ListShow[]) {
  const { user } = useAuth()
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([])
  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(
    new Set(),
  )
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(
    new Set(),
  )
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>(
    {},
  )
  const [showRatings, setShowRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    const client = supabase
    const uid = session?.profileId
    if (!uid || !client) {
      setAttendedShowIds([])
      return
    }
    async function fetch(sb: NonNullable<typeof supabase>) {
      try {
        const { data, error } = await sb
          .from("user_attended_shows")
          .select("show_id")
          .eq("user_id", uid)
        if (error) throw error
        setAttendedShowIds((data ?? []).map((r) => r.show_id))
      } catch {
        setAttendedShowIds([])
      }
    }
    fetch(client)
  }, [user])

  useEffect(() => {
    const client = supabase
    if (!client || shows.length === 0) return
    const showIds = shows.map((s) => s.show_id)

    async function fetchAll(sb: NonNullable<typeof supabase>) {
      try {
        const [setlistRes, releaseRes, attendeeRes, ratingsRes] =
          await Promise.all([
            sb.from("show_setlists").select("show_id").in("show_id", showIds),
            sb.from("releases_shows").select("show_id").in("show_id", showIds),
            sb.from("user_attended_shows").select("show_id").in("show_id", showIds),
            sb.from("show_ratings").select("show_id, rating").in("show_id", showIds),
          ])

        setShowsWithSetlists(
          new Set((setlistRes.data ?? []).map((r) => r.show_id)),
        )
        setShowsWithReleases(
          new Set((releaseRes.data ?? []).map((r) => r.show_id)),
        )

        const counts: Record<string, number> = {}
        showIds.forEach((id) => (counts[id] = 0))
        ;(attendeeRes.data ?? []).forEach((r) => {
          counts[r.show_id] = (counts[r.show_id] ?? 0) + 1
        })
        setAttendeeCounts(counts)

        const ratings: Record<string, number> = {}
        const byShow = new Map<string, number[]>()
        ;(ratingsRes.data ?? []).forEach((r) => {
          const arr = byShow.get(r.show_id) ?? []
          arr.push((r as { rating?: number }).rating ?? 0)
          byShow.set(r.show_id, arr)
        })
        byShow.forEach((vals, showId) => {
          const avg = vals.reduce((s, v) => s + v, 0) / vals.length
          ratings[showId] = Math.round(avg * 100) / 100
        })
        setShowRatings(ratings)
      } catch {
        // ignore
      }
    }
    fetchAll(client)
  }, [shows])

  return {
    attendedShowIds,
    showsWithSetlists,
    showsWithReleases,
    attendeeCounts,
    showRatings,
  }
}

export function useCategoryArtwork(shows: ListShow[]) {
  const [categoryArtwork, setCategoryArtwork] = useState<
    Record<string, string>
  >({})

  useEffect(() => {
    const client = supabase
    if (!client || shows.length === 0) return
    const cats = [
      ...new Set(
        shows
          .map((s) => s.show_listcategorycomplete)
          .filter((c): c is string => Boolean(c)),
      ),
    ]
    if (cats.length === 0) return
    client
      .from("categories")
      .select("category, category_artwork")
      .in("category", cats)
      .then(({ data }) => {
        const map: Record<string, string> = {}
        ;(data ?? []).forEach((c) => {
          if (c.category_artwork) map[c.category] = c.category_artwork
        })
        setCategoryArtwork(map)
      })
  }, [shows])

  return categoryArtwork
}
