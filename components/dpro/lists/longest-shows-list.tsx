"use client"

import { useEffect } from "react"
import { useLongestShowsList } from "@/hooks/use-longest-shows-list"
import { useListShowData } from "@/hooks/use-list-show-data"
import { ListShowTable } from "./list-show-table"
import { useListContentLoading } from "./list-content-loading-context"
import { WlHomeV2ListArchiveShowHeader } from "./wl-home-v2-list-archive-show-header"

interface LongestShowsListProps {
  listId: string
  listName?: string
  listDescription?: string | null
  wlHomeV2?: boolean
}

export function LongestShowsList({
  listId: listIdProp,
  listName,
  listDescription,
  wlHomeV2 = false,
}: LongestShowsListProps) {
  void listIdProp
  const { shows, loading, error, progress } = useLongestShowsList()
  const ctx = useListContentLoading()
  const {
    attendedShowIds,
    showsWithSetlists,
    showsWithReleases,
    attendeeCounts,
    showRatings,
  } = useListShowData(shows)

  const setListContentLoading = ctx?.setLoading
  const setListContentProgress = ctx?.setProgress

  useEffect(() => {
    setListContentLoading?.(loading)
  }, [loading, setListContentLoading])
  useEffect(() => {
    setListContentProgress?.(progress)
  }, [progress, setListContentProgress])

  if (loading) return null

  if (error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  if (shows.length === 0) {
    if (wlHomeV2 && listName) {
      return (
        <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
          <section className="wl-home-v2-longest-shows-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
              <WlHomeV2ListArchiveShowHeader
                listName={listName}
                listDescription={listDescription}
              />
              <div className="px-3 py-2 text-xs text-white/55">No shows found.</div>
            </div>
          </section>
        </div>
      )
    }
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        No shows found.
      </div>
    )
  }

  const table = (
    <ListShowTable
      shows={shows}
      attendedShowIds={attendedShowIds}
      showsWithSetlists={showsWithSetlists}
      showsWithReleases={showsWithReleases}
      attendeeCounts={attendeeCounts}
      showRatings={showRatings}
      showRanking
      wlHomeV2={wlHomeV2}
    />
  )

  if (wlHomeV2 && listName) {
    return (
      <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
        <section className="wl-home-v2-longest-shows-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
            <WlHomeV2ListArchiveShowHeader
              listName={listName}
              listDescription={listDescription}
            />
            {table}
          </div>
        </section>
      </div>
    )
  }

  return table
}
