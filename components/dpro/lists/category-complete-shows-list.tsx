"use client"

import { useEffect } from "react"
import { useCategoryCompleteShowsList } from "@/hooks/use-complete-shows-list"
import { useListShowData, useCategoryArtwork } from "@/hooks/use-list-show-data"
import { ListShowTable } from "./list-show-table"
import { useListContentLoading } from "./list-content-loading-context"

export function CategoryCompleteShowsList() {
  const { shows, loading, error, progress } = useCategoryCompleteShowsList()
  const ctx = useListContentLoading()
  const {
    attendedShowIds,
    showsWithSetlists,
    showsWithReleases,
    attendeeCounts,
    showRatings,
  } = useListShowData(shows)
  const categoryArtwork = useCategoryArtwork(shows)

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
      categoryArtwork={categoryArtwork}
      showCategoryColumn
    />
  )
}
