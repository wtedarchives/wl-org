"use client"

import { useEffect } from "react"
import {
  usePopularPlacementsData,
} from "@/hooks/use-popular-placements-data"
import { useListContentLoading } from "./list-content-loading-context"
import { POPULAR_PLACEMENT_SECTIONS } from "@/components/dpro/lists/popular-placements-list.constants"
import { PopularPlacementsWlArchiveBody } from "@/components/dpro/lists/popular-placements-wl-archive-body"
import { PopularPlacementsLegacyGrid } from "@/components/dpro/lists/popular-placements-legacy-grid"

interface PopularPlacementsListProps {
  listId: string
  listName?: string
  listDescription?: string | null
  wlHomeV2?: boolean
}

export function PopularPlacementsList({
  listId: listIdProp,
  listName,
  listDescription,
  wlHomeV2 = false,
}: PopularPlacementsListProps) {
  void listIdProp
  const data = usePopularPlacementsData()
  const ctx = useListContentLoading()
  const setListContentLoading = ctx?.setLoading
  const setListContentProgress = ctx?.setProgress

  useEffect(() => {
    setListContentLoading?.(data.loading)
  }, [data.loading, setListContentLoading])
  useEffect(() => {
    setListContentProgress?.(data.progress ?? 0)
  }, [data.progress, setListContentProgress])

  if (data.loading) return null

  if (data.error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {data.error}
      </div>
    )
  }

  const slice = {
    showOpeners: data.showOpeners,
    setOpeners: data.setOpeners,
    setClosers: data.setClosers,
    encores: data.encores,
  }

  const sectionModels = POPULAR_PLACEMENT_SECTIONS.map((section, index) => ({
    section,
    index,
    items: section.getItems(slice),
  }))

  if (wlHomeV2 && listName) {
    return (
      <PopularPlacementsWlArchiveBody
        listName={listName}
        listDescription={listDescription}
        sectionModels={sectionModels}
      />
    )
  }

  return <PopularPlacementsLegacyGrid data={slice} />
}
