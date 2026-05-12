"use client"

import {
  WlTopSlotsCategorySwatch,
} from "@/components/dpro/tours/top-slots-carousel"
import type { PlacementRow } from "@/hooks/use-popular-placements-data"
import type { PopularPlacementSection } from "@/components/dpro/lists/popular-placements-list.constants"
import { PopularPlacementsWlRankedRows } from "@/components/dpro/lists/popular-placements-wl-ranked-rows"

export function PopularPlacementsWlSectionTable({
  section,
  sectionIndex,
  items,
}: {
  section: PopularPlacementSection
  sectionIndex: number
  items: PlacementRow[]
}) {
  if (items.length === 0) {
    return (
      <div className="widget-panel w-full min-w-0 flex-1">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">{section.title}</span>
          <div className="wp-head-right">
            <WlTopSlotsCategorySwatch
              title={section.slotTitle}
              index={sectionIndex}
            />
          </div>
        </div>
        <div className="px-3 py-2 text-xs text-white/55">No data</div>
      </div>
    )
  }

  return (
    <div className="widget-panel w-full min-w-0 flex-1">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">{section.title}</span>
        <div className="wp-head-right">
          <WlTopSlotsCategorySwatch
            title={section.slotTitle}
            index={sectionIndex}
          />
        </div>
      </div>
      <div className="min-w-0">
        <table
          className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
        >
          <tbody>
            <PopularPlacementsWlRankedRows items={items} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
