import { supabase } from "@/lib/supabase"

export interface AttendedShow {
  id: string
  user_id: string
  show_id: string
  created_at: string
  show?: {
    show_id: string
    show_date: string
    show_group: string
    show_subvenue: string
    show_venue_location: string
    show_subvenue_venue: string
    venue_id?: string
    show_tour: string | null
    show_canonid: string | null
    tours?: { tour_id: string } | null
    show_detail: string | null
    show_alert: string | null
    show_length?: string | null
    show_rarity?: string | null
    show_gap?: string | null
  }
}

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

export async function fetchAttendedShows(
  userId: string,
  onProgress?: (progress: number) => void
): Promise<AttendedShow[]> {
  const client = supabase
  if (!client) return []

  onProgress?.(5)

  let allAttendanceData: {
    id: string
    user_id: string
    show_id: string
    created_at: string
  }[] = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await client
      .from("user_attended_shows")
      .select("*")
      .eq("user_id", userId)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw error

    if (data && data.length > 0) {
      allAttendanceData = [...allAttendanceData, ...data]
      page++
      onProgress?.(Math.min(25, 5 + page * 5))
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }

  if (allAttendanceData.length === 0) {
    onProgress?.(100)
    return []
  }

  const showIds = allAttendanceData.map((s) => s.show_id)
  onProgress?.(30)

  const showIdChunks: string[][] = []
  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
  }

  let allShowData: Record<
    string,
    {
      show_id: string
      show_date: string
      show_group: string
      show_subvenue: string
      show_venue_location: string
      show_subvenue_venue: string
      venue_id?: string
      show_tour: string | null
      show_canonid: string | null
      tours?: { tour_id: string } | null
      show_detail: string | null
      show_alert: string | null
      show_length?: string | null
      show_rarity?: string | null
      show_gap?: string | null
    }
  > = {}

  for (let i = 0; i < showIdChunks.length; i++) {
    const chunk = showIdChunks[i]
    page = 0
    hasMore = true

    while (hasMore) {
      const { data, error } = await client
        .from("shows")
        .select(
          `
          show_id,
          show_date,
          show_group,
          show_subvenue,
          show_venue_location,
          show_subvenue_venue,
          show_tour,
          show_canonid,
          show_length,
          show_rarity,
          show_gap,
          tours!show_tour(tour_id),
          show_detail,
          show_alert,
          subvenues:show_subvenue(
            venues:subvenue_venue(
              venue_id
            )
          )
        `
        )
        .in("show_id", chunk)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error

      if (data && data.length > 0) {
        data.forEach((show) => {
          const show_rarity =
            show.show_rarity != null
              ? `${Number(show.show_rarity).toFixed(2)}%`
              : null
          const show_gap =
            show.show_gap != null
              ? Number(show.show_gap).toFixed(2)
              : null
          const toursRaw = show.tours
          const tours =
            Array.isArray(toursRaw) && toursRaw.length > 0
              ? { tour_id: toursRaw[0].tour_id }
              : Array.isArray(toursRaw)
                ? null
                : toursRaw
          const subvenues = (show as { subvenues?: { venues?: { venue_id: string } } })
            .subvenues
          const venue_id = subvenues?.venues?.venue_id
          allShowData[show.show_id] = {
            show_id: show.show_id,
            show_date: show.show_date,
            show_group: show.show_group,
            show_subvenue: show.show_subvenue,
            show_venue_location: show.show_venue_location,
            show_subvenue_venue: show.show_subvenue_venue,
            show_tour: show.show_tour,
            show_canonid: show.show_canonid,
            show_detail: show.show_detail,
            show_alert: show.show_alert,
            show_length: show.show_length,
            show_rarity,
            show_gap,
            tours,
            venue_id,
          }
        })
        page++
        const progressPerChunk = 45 / showIdChunks.length
        const chunkProgress = (i / showIdChunks.length) * 45
        const pageProgress =
          (page * progressPerChunk) /
          Math.ceil(chunk.length / PAGE_SIZE)
        onProgress?.(
          Math.min(75, 30 + chunkProgress + pageProgress)
        )
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
  }

  onProgress?.(80)

  const combinedData: AttendedShow[] = allAttendanceData.map((attended) => {
    const showDetails = allShowData[attended.show_id]
    return {
      ...attended,
      show: showDetails,
    }
  })

  onProgress?.(90)

  const sorted = combinedData.sort((a, b) => {
    const aDate = a.show?.show_date
    const bDate = b.show?.show_date
    if (!aDate || !bDate) return 0
    return new Date(aDate).getTime() - new Date(bDate).getTime()
  })

  onProgress?.(100)
  return sorted
}
