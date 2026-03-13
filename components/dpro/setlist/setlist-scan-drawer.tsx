"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  formatShowDateLong,
  getPlacementColor,
} from "@/lib/setlist-utils"
import { getChangeTypeIcon } from "./setlist-show-change-icon"
import type { Show, SetlistEntry } from "@/types/setlist"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import { cn } from "@/lib/utils"

interface SetlistScanDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setlistUrl: string
  show: Show
  setlist: SetlistEntry[]
  changes: ShowChangeRow[]
  error?: string | null
}

export function SetlistScanDrawer({
  open,
  onOpenChange,
  setlistUrl,
  show,
  setlist,
  changes,
  error,
}: SetlistScanDrawerProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[90vh] max-w-[800px] mx-auto flex-col overflow-hidden rounded-xl data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:min-h-[70vh] after:!h-0">
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col md:flex-row md:items-start min-h-[50vh]">
          {/* Left column – Setlist Scan */}
          <div className="flex w-full shrink-0 flex-col md:w-[312px]">
            <DrawerHeader className="shrink-0 border-b border-border/50 py-[2px] flex-row items-center justify-between gap-2">
              <span className="size-8 shrink-0" aria-hidden />
              <DrawerTitle className="text-sm font-semibold">
                Setlist Scan
              </DrawerTitle>
              <span className="size-8 shrink-0 hidden md:block" aria-hidden />
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 md:hidden"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="flex items-center justify-center p-3">
              {!imageError && setlistUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={setlistUrl}
                  alt="Setlist scan"
                  className="max-h-[500px] max-w-full w-auto rounded-lg object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Image unavailable
                </p>
              )}
            </div>
          </div>

          {/* Right column – Actual Setlist + Changes */}
          <div className="flex min-w-0 flex-1 flex-col">
            <DrawerHeader className="shrink-0 border-b border-border/50 py-2">
              <DrawerTitle className="text-sm font-semibold">
                Actual Setlist
              </DrawerTitle>
            </DrawerHeader>

            <div className="space-y-4 p-4">
                {/* Show details */}
                <div className="text-xs">
                  <p className="font-semibold text-foreground">
                    {show.show_group}
                  </p>
                  <p className="text-muted-foreground">
                    {formatShowDateLong(show.show_date)}
                  </p>
                  {show.show_subvenue && (
                    <p className="text-muted-foreground">
                      {show.show_subvenue}
                    </p>
                  )}
                  {show.show_venue_location && (
                    <p className="text-muted-foreground/80">
                      {show.show_venue_location}
                    </p>
                  )}
                </div>

                {/* Setlist */}
                <div className="space-y-0.5 rounded-xl border border-border bg-muted/40 px-2 py-2">
                  {setlist.map((entry, index) => {
                    const prev = index > 0 ? setlist[index - 1] : null
                    const isNewSet = prev && prev.entry_set !== entry.entry_set
                    const placementColor = getPlacementColor(
                      entry.entry_placement,
                    )

                    return (
                      <div key={entry.entry_id}>
                        {isNewSet && (
                          <hr className="my-1 border-border/60" />
                        )}
                        <div className="flex items-center text-[11px] text-foreground">
                          <div
                            className="w-1 shrink-0 rounded-sm"
                            style={{ backgroundColor: placementColor }}
                          >
                            &nbsp;
                          </div>
                          <div className="flex flex-1 items-center gap-2 pl-2">
                            <span className="truncate font-medium">
                              <Link
                                href={`/archive/songs/${entry.songs.song_id}`}
                                className="hover:underline"
                              >
                                {entry.entry_song}
                              </Link>
                              {entry.entry_short && (
                                <span className="ml-1 text-[10px] font-medium text-destructive">
                                  [{entry.entry_short}]
                                </span>
                              )}
                              {entry.entry_segue && (
                                <span className="ml-1 text-red-400">
                                  → {entry.entry_segue.replace(/^>\s*/, "").trim()}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Setlist Changes */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">
                    Setlist Changes
                  </p>
                  {error && (
                    <p className="mb-2 text-xs text-destructive">{error}</p>
                  )}
                  {changes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No changes from original setlist.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-xs text-muted-foreground [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline">
                      {changes.map((c) => {
                        const iconConfig = getChangeTypeIcon(c.change_type)
                        return (
                          <li
                            key={c.show_change_uuid}
                            className="flex items-start gap-1.5 line-clamp-2"
                          >
                            {iconConfig && (
                              <iconConfig.Icon
                                className={cn(
                                  "size-3.5 shrink-0 mt-[1px]",
                                  iconConfig.colorClass,
                                )}
                              />
                            )}
                            <span dangerouslySetInnerHTML={{ __html: c.change }} />
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
