"use client"

import { useEffect } from "react"
import { useDripfieldCompleteShowsList } from "@/hooks/use-complete-shows-list"
import { useListShowData } from "@/hooks/use-list-show-data"
import { ListShowTable } from "./list-show-table"
import { useListContentLoading } from "./list-content-loading-context"

export function DripfieldCompleteShowsList() {
  const { shows, loading, error, progress } = useDripfieldCompleteShowsList()
  const ctx = useListContentLoading()
  const {
    attendedShowIds,
    showsWithSetlists,
    showsWithReleases,
    attendeeCounts,
    showRatings,
  } = useListShowData(shows)

  useEffect(() => {
    ctx?.setLoading(loading)
  }, [loading, ctx])
  useEffect(() => {
    ctx?.setProgress(progress)
  }, [progress, ctx])

  if (loading) return null

  if (error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  if (shows.length === 0) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        No shows found.
      </div>
    )
  }

  return (
    <ListShowTable
      shows={shows}
      attendedShowIds={attendedShowIds}
      showsWithSetlists={showsWithSetlists}
      showsWithReleases={showsWithReleases}
      attendeeCounts={attendeeCounts}
      showRatings={showRatings}
    />
  )
}
