"use client"

import { WlHomeV2ListArchiveShowHeader } from "@/components/dpro/lists/wl-home-v2-list-archive-show-header"
import type {
  SandwichRow,
  UnfinishedRow,
} from "@/hooks/use-unfinished-reprised-data"
import {
  ReprisesWlPanel,
  UnfinishedWlPanel,
} from "@/components/dpro/lists/unfinished-reprised-wl-panels"

export function UnfinishedReprisedWlArchiveBody({
  listName,
  listDescription,
  unfinished,
  sandwiches,
  onSandwichClick,
}: {
  listName: string
  listDescription?: string | null
  unfinished: UnfinishedRow[]
  sandwiches: SandwichRow[]
  onSandwichClick: (row: SandwichRow) => void
}) {
  return (
    <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
      <section className="wl-home-v2-unfinished-reprised-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <WlHomeV2ListArchiveShowHeader
            listName={listName}
            listDescription={listDescription}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:gap-4">
            <UnfinishedWlPanel rows={unfinished} />
            <ReprisesWlPanel rows={sandwiches} onSandwichClick={onSandwichClick} />
          </div>
        </div>
      </section>
    </div>
  )
}
