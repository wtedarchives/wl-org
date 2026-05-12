"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { SlotData } from "@/types/tour"
import { cn } from "@/lib/utils"

interface TopSlotsCarouselProps {
  slots: SlotData[]
  isMobile?: boolean
  songIdMap?: Record<string, string>
  onSongClick?: (songName: string, songDisplayName?: string | null) => void
  tourId?: string
  /** WL Home archive tour stats: chrome matches Slots (`TourSlotsTable` widget-panel + wp-head typography). */
  wlHomeV2?: boolean
}

const TOP_SLOTS_CATEGORY_CLASS: Record<string, string> = {
  "Show Openers": "wl-home-v2-top-slots-cat--show-openers",
  "Set Openers": "wl-home-v2-top-slots-cat--set-openers",
  "Set Closers": "wl-home-v2-top-slots-cat--set-closers",
  "Show Closers": "wl-home-v2-top-slots-cat--set-closers",
  Encores: "wl-home-v2-top-slots-cat--encores",
}

/** Class names wired in wl-home-v2.css (same hues as tour slot headers). */
export function getTopSlotsCategoryClassName(title: string, index: number): string {
  const named = TOP_SLOTS_CATEGORY_CLASS[title]
  if (named) return named
  const i = index.toString()
  if (i === "0" || i === "1" || i === "2" || i === "3") {
    return `wl-home-v2-top-slots-cat--i${i}`
  }
  return "wl-home-v2-top-slots-cat--fallback"
}

/** Small rounded rectangle — matches tour `TopSlotsCarousel` WL chrome. */
export function WlTopSlotsCategorySwatch({
  title,
  index,
}: {
  title: string
  index: number
}) {
  return (
    <span
      className={cn(
        "wl-home-v2-top-slots-swatch",
        getTopSlotsCategoryClassName(title, index),
      )}
      aria-hidden
    />
  )
}

function SlotMiniTableRows({
  data,
  wlHomeV2,
  onSongClick,
}: {
  data: SlotData["data"]
  wlHomeV2: boolean
  onSongClick?: (songName: string, songDisplayName?: string | null) => void
}) {
  return (
    <>
      {data.map((item, i) => (
        <tr
          key={i}
          className={cn(
            "transition-colors",
            wlHomeV2 ?
              "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0"
            : "bg-background/70 hover:bg-muted/40",
          )}
        >
          <td
            className={cn(
              wlHomeV2 ? "wl-home-v2-top-slots-stats-cell" : "py-0.5 pl-3",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSongClick?.(item.left, item.displayName)}
                className={cn(
                  "cursor-pointer text-left font-medium hover:underline",
                  wlHomeV2 ?
                    "text-white/88"
                  : "text-foreground",
                )}
              >
                <SongDisplayName
                  song={item.left}
                  songDisplayName={item.displayName}
                />
              </button>
              {item.artwork && (
                <span className="inline-flex shrink-0 items-center !pr-2">
                  <img
                    src={item.artwork}
                    alt=""
                    className={cn(
                      "size-5 shrink-0 rounded object-cover",
                      wlHomeV2 ?
                        "border border-[rgb(63,65,64)]"
                      : "border border-border",
                    )}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display =
                        "none"
                    }}
                  />
                </span>
              )}
            </div>
          </td>
          <td
            className={cn(
              "w-[30px] text-center font-medium tabular-nums",
              wlHomeV2 ?
                "wl-home-v2-top-slots-stats-cell text-white/88"
              : "py-1.5 text-foreground",
            )}
          >
            {typeof item.right === "number" ? item.right : item.right}
          </td>
        </tr>
      ))}
    </>
  )
}

export function TopSlotsCarousel({
  slots,
  isMobile = false,
  onSongClick,
  wlHomeV2 = false,
}: TopSlotsCarouselProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const slotsWithData = slots.filter((s) => s.data.length > 0)
  if (slotsWithData.length === 0) return null

  const safeIndex = Math.min(currentSlideIndex, slotsWithData.length - 1)
  const currentSlide = slotsWithData[safeIndex]
  const currentTitle = currentSlide.title

  const renderSlotTable = (slot: SlotData, index: number) => {
    if (slot.data.length === 0) return null

    if (wlHomeV2) {
      return (
        <div
          key={slot.title}
          className="widget-panel w-full min-w-0 flex-1 overflow-hidden"
        >
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span className="min-w-0 truncate">{`Top ${slot.title}`}</span>
            <div className="wp-head-right">
              <WlTopSlotsCategorySwatch title={slot.title} index={index} />
            </div>
          </div>
          <div className="min-w-0 max-h-64 overflow-x-auto overflow-y-auto">
            <table
              className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
            >
              <tbody>
                <SlotMiniTableRows
                  data={slot.data}
                  wlHomeV2
                  onSongClick={onSongClick}
                />
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    return (
      <Card
        key={slot.title}
        className="flex-1 min-w-0 ring-0 border border-border/60 bg-background/70 overflow-hidden py-0"
      >
        <div
          className={cn(
            "wl-home-v2-top-slots-legacy-card-head px-3 py-1.5 text-white",
            getTopSlotsCategoryClassName(slot.title, index),
          )}
        >
          <h3 className="text-sm font-semibold">Top {slot.title}</h3>
        </div>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full border-collapse text-[11px] leading-3">
              <tbody>
                <SlotMiniTableRows
                  data={slot.data}
                  wlHomeV2={false}
                  onSongClick={onSongClick}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className={!isMobile ? "xl:hidden" : ""}>
        {wlHomeV2 ?
          <div className="widget-panel w-full min-w-0 shrink-0 overflow-hidden">
            <div className="wp-head wl-home-v2-years-shows-wp-head">
              <span className="min-w-0 truncate">Top Slots</span>
              <div className="wp-head-right">
                {slotsWithData.length > 1 ?
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "wl-home-v2-top-slots-mobile-dd-trigger shrink-0 gap-1 rounded-[4px] border border-black/25 !h-auto min-h-0",
                          "!py-px !pl-2 !pr-1.5",
                          "font-mono text-[10px] !font-normal uppercase leading-normal tracking-[0.08em]",
                          "text-white/[0.90] shadow-none hover:text-white/[0.78]",
                          getTopSlotsCategoryClassName(currentTitle, safeIndex),
                        )}
                      >
                        {currentTitle}
                        <ChevronDown
                          className="ml-0.5 size-2.5 shrink-0 opacity-70"
                          aria-hidden
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      {slotsWithData.map((slot, i) => (
                        <DropdownMenuItem
                          key={slot.title}
                          onClick={() => setCurrentSlideIndex(i)}
                        >
                          {slot.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                : null}
                <WlTopSlotsCategorySwatch
                  title={currentTitle}
                  index={safeIndex}
                />
              </div>
            </div>
            <div className="max-h-72 min-w-0 overflow-x-auto overflow-y-auto">
              <table
                className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
              >
                <tbody>
                  <SlotMiniTableRows
                    data={currentSlide.data}
                    wlHomeV2
                    onSongClick={onSongClick}
                  />
                </tbody>
              </table>
            </div>
          </div>
        : <Card className="ring-0 border border-border/60 bg-background/70 overflow-hidden py-0">
            <div
              className={cn(
                "wl-home-v2-top-slots-legacy-card-head flex items-center justify-between px-3 py-1.5 text-white",
                getTopSlotsCategoryClassName(currentTitle, safeIndex),
              )}
            >
              <h2 className="text-sm font-semibold">Top Slots</h2>
              {slotsWithData.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-white hover:bg-white/20 border border-black/30"
                    >
                      {currentTitle}
                      <ChevronDown className="ml-1 size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    {slotsWithData.map((slot, i) => (
                      <DropdownMenuItem
                        key={slot.title}
                        onClick={() => setCurrentSlideIndex(i)}
                      >
                        {slot.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full border-collapse text-[11px] leading-3">
                  <tbody>
                    <SlotMiniTableRows
                      data={currentSlide.data}
                      wlHomeV2={false}
                      onSongClick={onSongClick}
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        }
      </div>

      <div
        className={!isMobile ? "hidden xl:flex xl:flex-row gap-4" : "hidden"}
      >
        {slotsWithData.map((slot, i) => renderSlotTable(slot, i))}
      </div>
    </>
  )
}
