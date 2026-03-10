"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { ListShow } from "./use-list-show-data"

type CompleteType = "category" | "jive" | "dripfield"

const SHOW_SELECT = `
  show_id,
  show_date,
  show_group,
  show_tour,
  show_subvenue,
  show_subvenue_venue,
  show_venue_location,
  show_detail,
  show_alert,
  show_wl_link,
  show_length,
  show_rarity,
  show_gap,
  show_listcategorycomplete,
  subvenues:show_subvenue(
    venues:subvenue_venue(
      venue_id
    )
  ),
  tours:show_tour(
    tour_id
  )
`

function mapShow(s: any): ListShow {
  return {
    show_id: s.show_id,
    show_date: s.show_date,
    show_group: s.show_group,
    show_tour: s.show_tour,
    tour_id: (Array.isArray(s.tours) ? s.tours[0] : s.tours)?.tour_id ?? null,
    show_subvenue: s.show_subvenue,
    show_subvenue_venue: s.show_subvenue_venue ?? null,
    show_venue_location: s.show_venue_location,
    show_detail: s.show_detail,
    show_alert: s.show_alert,
    show_wl_link: s.show_wl_link,
    venue_id: (() => {
      const sub = Array.isArray(s.subvenues) ? s.subvenues[0] : s.subvenues
      const ven = Array.isArray(sub?.venues) ? sub?.venues?.[0] : sub?.venues
      return ven?.venue_id ?? s.show_subvenue_venue ?? null
    })(),
    show_length: s.show_length ?? "-",
    show_rarity:
      s.show_rarity != null ? `${Number(s.show_rarity).toFixed(2)}%` : null,
    show_gap: s.show_gap != null ? Number(s.show_gap).toFixed(2) : null,
    show_listcategorycomplete: s.show_listcategorycomplete ?? undefined,
  }
}

export function useCategoryCompleteShowsList() {
  return useCompleteShowsList("category")
}

export function useJiveCompleteShowsList() {
  return useCompleteShowsList("jive")
}

export function useDripfieldCompleteShowsList() {
  return useCompleteShowsList("dripfield")
}

function useCompleteShowsList(type: CompleteType) {
  const [shows, setShows] = useState<ListShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    async function fetchShows(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        let query = sb.from("shows").select(SHOW_SELECT)

        if (type === "category") {
          query = query
            .not("show_listcategorycomplete", "is", null)
            .neq("show_listcategorycomplete", "")
        } else if (type === "jive") {
          query = query.eq("show_jivecomplete", true)
        } else {
          query = query.eq("show_dripfieldcomplete", true)
        }

        const { data, error: fetchError } = await query.order("show_date", {
          ascending:
            type === "category" || type === "jive" || type === "dripfield",
        })

        if (fetchError) throw fetchError
        setShows((data ?? []).map(mapShow))
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load shows")
        setShows([])
      } finally {
        setLoading(false)
      }
    }

    fetchShows(client)
  }, [type])

  return { shows, loading, error, progress }
}
