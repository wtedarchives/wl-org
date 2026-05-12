"use client"

import { useState, useEffect } from "react"
import { useUnfinishedReprisedData } from "@/hooks/use-unfinished-reprised-data"
import type { SandwichRow } from "@/hooks/use-unfinished-reprised-data"
import { WlHomeV2RepriseSandwichModal } from "@/components/wl-home-v2/wl-home-v2-reprise-sandwich-modal"
import { useListContentLoading } from "./list-content-loading-context"
import { UnfinishedReprisedWlArchiveBody } from "@/components/dpro/lists/unfinished-reprised-wl-archive-body"
import { UnfinishedReprisedLegacyGrid } from "@/components/dpro/lists/unfinished-reprised-legacy-grid"

interface UnfinishedReprisedListProps {
  listId: string
  listName?: string
  listDescription?: string | null
  wlHomeV2?: boolean
}

export function UnfinishedReprisedList({
  listId: listIdProp,
  listName,
  listDescription,
  wlHomeV2 = false,
}: UnfinishedReprisedListProps) {
  void listIdProp
  const { unfinished, sandwiches, loading, error, progress } =
    useUnfinishedReprisedData()
  const ctx = useListContentLoading()
  const [sandwichDrawerOpen, setSandwichDrawerOpen] = useState(false)
  const [drawerSandwich, setDrawerSandwich] = useState<SandwichRow | null>(null)

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

  const openSandwich = (row: SandwichRow) => {
    setDrawerSandwich(row)
    setSandwichDrawerOpen(true)
  }

  const sandwichModal = (
    <WlHomeV2RepriseSandwichModal
      open={sandwichDrawerOpen}
      onClose={() => setSandwichDrawerOpen(false)}
      sandwich={drawerSandwich}
    />
  )

  if (wlHomeV2 && listName) {
    return (
      <>
        <UnfinishedReprisedWlArchiveBody
          listName={listName}
          listDescription={listDescription}
          unfinished={unfinished}
          sandwiches={sandwiches}
          onSandwichClick={openSandwich}
        />
        {sandwichModal}
      </>
    )
  }

  return (
    <>
      <UnfinishedReprisedLegacyGrid
        unfinished={unfinished}
        sandwiches={sandwiches}
        onSandwichRowClick={(row) => {
          setDrawerSandwich(row)
          setSandwichDrawerOpen(true)
        }}
      />
      {sandwichModal}
    </>
  )
}
