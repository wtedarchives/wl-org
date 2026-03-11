"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type {
  SetOptions,
  SetnumOptions,
  SegueOptions,
  PlacementOptions,
  SongOptions,
  ShortOptions,
  GuestCategory,
} from "@/types/admin"

const PAGE_SIZE = 1000

export function useSetlistOptions() {
  const [sets, setSets] = useState<SetOptions[]>([])
  const [setnums, setSetnums] = useState<SetnumOptions[]>([])
  const [segues, setSegues] = useState<SegueOptions[]>([])
  const [placements, setPlacements] = useState<PlacementOptions[]>([])
  const [songs, setSongs] = useState<SongOptions[]>([])
  const [shorts, setShorts] = useState<ShortOptions[]>([])
  const [allGuests, setAllGuests] = useState<GuestCategory[]>([])

  useEffect(() => {
    const fetchOptions = async () => {
      if (!supabase) return
      try {
        const { data: setsData, error: setsError } = await supabase
          .from("sets")
          .select("set")
          .order("set")
        if (!setsError) setSets(setsData || [])

        const { data: setnumsData, error: setnumsError } = await supabase
          .from("setnums")
          .select("setnums")
          .order("setnums")
        if (!setnumsError) setSetnums(setnumsData || [])

        const { data: seguesData, error: seguesError } = await supabase
          .from("segues")
          .select("segues")
          .order("segues")
        if (!seguesError) setSegues(seguesData || [])

        const { data: placementsData, error: placementsError } = await supabase
          .from("placements")
          .select("placements")
          .order("placement_order")
        if (!placementsError) setPlacements(placementsData || [])

        let allSongsData: SongOptions[] = []
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data: songsData, error: songsError } = await supabase
            .from("songs")
            .select("song, song_id")
            .order("song")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
          if (!songsError && songsData && songsData.length > 0) {
            allSongsData = [...allSongsData, ...songsData]
            page++
            hasMore = songsData.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }
        setSongs(allSongsData)

        const { data: shortsData, error: shortsError } = await supabase
          .from("song_shorts")
          .select("song_shorts")
          .order("song_shorts")
        if (!shortsError) setShorts(shortsData || [])

        const { data: guestsData, error: guestsError } = await supabase
          .from("guests")
          .select("guest_id, guest, guest_displayname, guest_category, guest_instrument")
          .order("guest_category")
          .order("guest_displayname")
        if (!guestsError && guestsData) {
          const guestsByCategory: Record<string, typeof guestsData> = {}
          guestsData.forEach((g) => {
            const cat = g.guest_category || "Uncategorized"
            if (!guestsByCategory[cat]) guestsByCategory[cat] = []
            guestsByCategory[cat].push(g)
          })
          const grouped: GuestCategory[] = Object.keys(guestsByCategory)
            .sort()
            .map((category) => ({
              category,
              guests: guestsByCategory[category],
            }))
          setAllGuests(grouped)
        }
      } catch {
        // silent
      }
    }
    fetchOptions()
  }, [])

  return {
    sets,
    setnums,
    segues,
    placements,
    songs,
    shorts,
    allGuests,
  }
}
