"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  getTopSlotsCategoryClassName,
  WlTopSlotsCategorySwatch,
} from "@/components/dpro/tours/top-slots-carousel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PlacementRow } from "@/hooks/use-popular-placements-data"
import type { PopularPlacementSection } from "@/components/dpro/lists/popular-placements-list.constants"
import { WlHomeV2ListArchiveShowHeader } from "@/components/dpro/lists/wl-home-v2-list-archive-show-header"
import { PopularPlacementsWlSectionTable } from "@/components/dpro/lists/popular-placements-wl-section-table"
import { PopularPlacementsWlRankedRows } from "@/components/dpro/lists/popular-placements-wl-ranked-rows"

export function PopularPlacementsWlArchiveBody({
  listName,
  listDescription,
  sectionModels,
}: {
  listName: string
  listDescription?: string | null
  sectionModels: {
    section: PopularPlacementSection
    index: number
    items: PlacementRow[]
  }[]
}) {
  const sectionsWithData = sectionModels.filter((s) => s.items.length > 0)
  const [mobileIndex, setMobileIndex] = useState(0)
  const safeMobileIndex =
    sectionsWithData.length > 0 ?
      Math.min(mobileIndex, sectionsWithData.length - 1)
    : 0
  const currentMobile =
    sectionsWithData[safeMobileIndex] ?? sectionModels[0] ?? null

  return (
    <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
      <section className="wl-home-v2-popular-placements-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <WlHomeV2ListArchiveShowHeader
            listName={listName}
            listDescription={listDescription}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
            <div className="xl:hidden">
              <div className="widget-panel w-full min-w-0 shrink-0">
                <div className="wp-head wl-home-v2-years-shows-wp-head">
                  <span className="min-w-0 truncate">Top Slots</span>
                  <div className="wp-head-right">
                    {sectionsWithData.length > 1 ?
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "wl-home-v2-top-slots-mobile-dd-trigger shrink-0 gap-1 rounded-[4px] border border-black/25 !h-auto min-h-0",
                              "!py-px !pl-2 !pr-1.5",
                              "font-mono text-[10px] !font-normal uppercase leading-normal tracking-[0.08em]",
                              "text-white/[0.90] shadow-none hover:text-white/[0.78]",
                              currentMobile ?
                                getTopSlotsCategoryClassName(
                                  currentMobile.section.slotTitle,
                                  currentMobile.index,
                                )
                              : "wl-home-v2-top-slots-cat--fallback",
                            )}
                          >
                            {currentMobile?.section.title ?? ""}
                            <ChevronDown
                              className="ml-0.5 size-2.5 shrink-0 opacity-70"
                              aria-hidden
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {sectionsWithData.map((entry, i) => (
                            <DropdownMenuItem
                              key={entry.section.title}
                              onClick={() => setMobileIndex(i)}
                            >
                              {entry.section.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    : null}
                    {currentMobile ?
                      <WlTopSlotsCategorySwatch
                        title={currentMobile.section.slotTitle}
                        index={currentMobile.index}
                      />
                    : null}
                  </div>
                </div>
                <div className="min-w-0">
                  {currentMobile ?
                    <table
                      className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
                    >
                      <tbody>
                        {currentMobile.items.length === 0 ?
                          <tr>
                            <td className="px-3 py-2 text-xs text-white/55">
                              No data
                            </td>
                          </tr>
                        : <PopularPlacementsWlRankedRows
                            items={currentMobile.items}
                          />}
                      </tbody>
                    </table>
                  : null}
                </div>
              </div>
            </div>

            <div className="hidden min-h-0 flex-1 xl:flex xl:flex-row xl:gap-4">
              {sectionModels.map(({ section, index, items }) => (
                <PopularPlacementsWlSectionTable
                  key={section.title}
                  section={section}
                  sectionIndex={index}
                  items={items}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
