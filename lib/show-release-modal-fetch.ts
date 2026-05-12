import { supabase } from "@/lib/supabase"

export interface ShowReleaseModalReleaseRow {
  release_id: string
  release: string
  release_displayname: string
  release_service: string | null
}

const PAGE_SIZE = 1000

export async function fetchShowReleaseModalReleases(showId: string): Promise<{
  availableReleases: ShowReleaseModalReleaseRow[]
  allAssociatedReleaseIds: Set<string>
  nextOrder: number
}> {
  if (!supabase) {
    return {
      availableReleases: [],
      allAssociatedReleaseIds: new Set(),
      nextOrder: 1,
    }
  }

  let allReleases: ShowReleaseModalReleaseRow[] = []
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error: err } = await supabase
      .from("releases")
      .select("release_id, release, release_displayname, release_service")
      .order("release_displayname", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (err) throw err
    if (data?.length) {
      allReleases = [...allReleases, ...data]
      page++
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }

  let allShowReleases: { release_id: string }[] = []
  let ap = 0
  let hasMoreA = true
  while (hasMoreA) {
    const { data, error: err } = await supabase
      .from("releases_shows")
      .select("release_id")
      .range(ap * PAGE_SIZE, (ap + 1) * PAGE_SIZE - 1)
    if (err) throw err
    if (data?.length) {
      allShowReleases = [...allShowReleases, ...data]
      ap++
      hasMoreA = data.length === PAGE_SIZE
    } else {
      hasMoreA = false
    }
  }

  const { data: thisShowReleases } = await supabase
    .from("releases_shows")
    .select("release_id, release_order")
    .eq("show_id", showId)

  const allIds = new Set(allShowReleases?.map((r) => r.release_id) ?? [])
  const thisIds = new Set(thisShowReleases?.map((r) => r.release_id) ?? [])
  const maxOrder =
    thisShowReleases?.length &&
    Math.max(...thisShowReleases.map((r) => r.release_order ?? 0))
  const nextOrder = (maxOrder && maxOrder > 0 ? maxOrder : 0) + 1
  const available = allReleases.filter((r) => !thisIds.has(r.release_id))
  const sorted = available.sort((a, b) => {
    const aA = allIds.has(a.release_id)
    const bA = allIds.has(b.release_id)
    if (!aA && bA) return -1
    if (aA && !bA) return 1
    const aD = a.release_service ? `${a.release_service} - ${a.release}` : a.release
    const bD = b.release_service ? `${b.release_service} - ${b.release}` : b.release
    return aD.localeCompare(bD)
  })

  return {
    availableReleases: sorted,
    allAssociatedReleaseIds: allIds,
    nextOrder,
  }
}
