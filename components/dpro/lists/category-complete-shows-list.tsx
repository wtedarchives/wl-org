"use client"

import { useEffect } from "react"
import { useCategoryCompleteShowsList } from "@/hooks/use-complete-shows-list"
import { useListShowData, useCategoryArtwork } from "@/hooks/use-list-show-data"
import { CompleteShowsListWlShell } from "./complete-shows-list-wl-shell"
import { ListShowTable } from "./list-show-table"
import { useListContentLoading } from "./list-content-loading-context"

interface CategoryCompleteShowsListProps {
  listId: string
  listName?: string
  listDescription?: string | null
  wlHomeV2?: boolean
}

export function CategoryCompleteShowsList({
  listId: listIdProp,
  listName,
  listDescription,
  wlHomeV2 = false,
}: CategoryCompleteShowsListProps) {
  void listIdProp
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
    if (wlHomeV2 && listName) {
      return (
        <CompleteShowsListWlShell
          listName={listName}
          listDescription={listDescription}
          headerArtwork="category-complete"
        >
          <div className="px-3 py-2 text-xs text-white/55">No shows found.</div>
        </CompleteShowsListWlShell>
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
      categoryArtwork={categoryArtwork}
      showCategoryColumn
      wlHomeV2={wlHomeV2}
    />
  )

  if (wlHomeV2 && listName) {
    return (
      <CompleteShowsListWlShell
        listName={listName}
        listDescription={listDescription}
        headerArtwork="category-complete"
      >
        {table}
      </CompleteShowsListWlShell>
    )
  }

  return table
}
