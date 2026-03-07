"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { SlotData } from "@/types/tour"

interface TopSlotsCarouselProps {
  slots: SlotData[]
  isMobile?: boolean
  songIdMap?: Record<string, string>
  onSongClick?: (songName: string) => void
  tourId?: string
}

const SLOT_COLORS: Record<string, string> = {
  "Show Openers": "#047857",
  "Set Openers": "#10b981",
  "Set Closers": "#3b82f6",
  Encores: "#be123c",
  "0": "#006400",
  "1": "#019B7A",
  "2": "#E17401",
  "3": "#7C2128",
}

function getHeaderBgColor(title: string, index: number): string {
  return SLOT_COLORS[title] ?? SLOT_COLORS[index.toString()] ?? "#059669"
}

export function TopSlotsCarousel({
  slots,
  isMobile = false,
  onSongClick,
}: TopSlotsCarouselProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const slotsWithData = slots.filter((s) => s.data.length > 0)
  if (slotsWithData.length === 0) return null

  const safeIndex = Math.min(currentSlideIndex, slotsWithData.length - 1)
  const currentSlide = slotsWithData[safeIndex]
  const currentTitle = currentSlide.title

  const renderSlotTable = (slot: SlotData, index: number) => {
    if (slot.data.length === 0) return null
    const headerBg = getHeaderBgColor(slot.title, index)
    return (
      <Card
        key={slot.title}
        className="ring-0 border border-border/60 bg-background/70 overflow-hidden py-0"
      >
        <div
          className="px-3 py-1.5 text-white"
          style={{ backgroundColor: headerBg }}
        >
          <h3 className="text-sm font-semibold">Top {slot.title}</h3>
        </div>
        <CardContent className="p-0">
          <div className="overflow-y-auto max-h-64">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {slot.data.map((item, i) => (
                  <tr
                    key={i}
                    className="bg-background/70 hover:bg-muted/40 transition-colors"
                  >
                    <td className="pl-3 py-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSongClick?.(item.left)}
                          className="font-medium text-foreground hover:underline cursor-pointer text-left"
                        >
                          {item.left}
                        </button>
                        {item.artwork && (
                          <img
                            src={item.artwork}
                            alt=""
                            className="size-5 shrink-0 rounded object-cover border border-border"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display =
                                "none"
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="w-[30px] py-1.5 text-center font-medium tabular-nums text-foreground">
                      {typeof item.right === "number" ? item.right : item.right}
                    </td>
                  </tr>
                ))}
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
        <Card className="ring-0 border border-border/60 bg-background/70 overflow-hidden py-0">
          <div
            className="py-1.5 px-3 flex justify-between items-center text-white"
            style={{
              backgroundColor: getHeaderBgColor(currentTitle, safeIndex),
            }}
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
                    <ChevronDown className="size-3 ml-1" />
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
            <div className="overflow-y-auto max-h-72">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {currentSlide.data.map((item, i) => (
                    <tr
                      key={i}
                      className="bg-background/70 hover:bg-muted/40 transition-colors"
                    >
                      <td className="pl-3 py-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSongClick?.(item.left)}
                            className="font-medium text-foreground hover:underline cursor-pointer text-left"
                          >
                            {item.left}
                          </button>
                          {item.artwork && (
                            <img
                              src={item.artwork}
                              alt=""
                              className="size-5 shrink-0 rounded object-cover border border-border"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display =
                                  "none"
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="w-[30px] py-1.5 text-center font-medium tabular-nums text-foreground">
                        {typeof item.right === "number"
                          ? item.right
                          : item.right}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className={
          !isMobile ? "hidden xl:grid xl:grid-cols-4 gap-4" : "hidden"
        }
      >
        {slotsWithData.map((slot, i) => renderSlotTable(slot, i))}
      </div>
    </>
  )
}
