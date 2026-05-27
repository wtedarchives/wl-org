"use client"

import type { ReactNode } from "react"
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SETLIST_HEADER_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { LAST_HEADER_TOOLTIP } from "@/components/dpro/setlist/display-setlist-table.constants"

export function DisplaySetlistTableHeader({
  wlHdr,
  hdrPad,
  showDiscographySourceCol,
  showWtedColumn,
  showCanonColumns,
  hasLastBadges,
  isDesktop,
  songHeaderTooltipContent,
  hasSongHeaderTooltipItems,
}: {
  wlHdr: boolean
  hdrPad: string
  showDiscographySourceCol: boolean
  showWtedColumn: boolean
  showCanonColumns: boolean
  hasLastBadges: boolean
  isDesktop: boolean
  songHeaderTooltipContent: ReactNode | null
  hasSongHeaderTooltipItems: boolean
}) {
  return (
    <TableHeader>
      <TableRow
        className={cn(
          "hover:bg-transparent",
          wlHdr ? "border-0 !h-auto min-h-0" : "h-8 border-border/60",
        )}
      >
        <TableHead
          className={cn(
            hdrPad,
            wlHdr && "center num-col shrink-0 text-center",
            !wlHdr && "h-8 w-4 shrink-0 text-center text-muted-foreground",
          )}
        >
          #
        </TableHead>
        <TableHead
          className={cn(hdrPad, !wlHdr && "h-8 text-muted-foreground")}
        >
          {hasSongHeaderTooltipItems && isDesktop ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(!wlHdr && "cursor-help", wlHdr && "setlist-th-help")}
                >
                  Song
                </span>
              </TooltipTrigger>
              <TooltipContent
                className={cn(
                  "max-w-[280px]",
                  wlHdr && "setlist-header-tooltip",
                )}
                {...(wlHdr ? SETLIST_HEADER_TOOLTIP_CONTENT : {})}
              >
                {songHeaderTooltipContent}
              </TooltipContent>
            </Tooltip>
          ) : (
            "Song"
          )}
        </TableHead>
        {showDiscographySourceCol ? (
          <TableHead
            className={cn(
              hdrPad,
              "min-w-[9rem] whitespace-nowrap text-left",
              !wlHdr && "h-8 text-muted-foreground",
            )}
          >
            Show
          </TableHead>
        ) : null}
        {showWtedColumn && (
          <TableHead
            className={cn(
              hdrPad,
              "text-center",
              wlHdr && "center",
              !wlHdr && "h-8 text-muted-foreground",
            )}
          >
            {isDesktop ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(!wlHdr && "cursor-help", wlHdr && "setlist-th-help")}
                  >
                    WTED
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  {...(wlHdr ?
                    {
                      ...SETLIST_HEADER_TOOLTIP_CONTENT,
                      className:
                        "setlist-header-tooltip setlist-header-tooltip--tight",
                    }
                  : {})}
                >
                  Use the icons below to request songs on WTED Goose Radio.
                </TooltipContent>
              </Tooltip>
            ) : (
              "WTED"
            )}
          </TableHead>
        )}
        <TableHead
          className={cn(
            hdrPad,
            "text-center",
            wlHdr && "center",
            !wlHdr && "h-8 text-muted-foreground",
          )}
        >
          Time
        </TableHead>
        {showCanonColumns && (
          <TableHead
            className={cn(
              hdrPad,
              wlHdr ? "center" : "text-center",
              !wlHdr && "h-8 text-muted-foreground",
            )}
          >
            {hasLastBadges && isDesktop ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(!wlHdr && "cursor-help", wlHdr && "setlist-th-help")}
                  >
                    Last
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  {...(wlHdr ? SETLIST_HEADER_TOOLTIP_CONTENT : {})}
                  className={cn(
                    "max-w-[240px] whitespace-pre-wrap text-xs",
                    wlHdr &&
                      "setlist-header-tooltip setlist-header-tooltip--last",
                  )}
                >
                  {LAST_HEADER_TOOLTIP}
                </TooltipContent>
              </Tooltip>
            ) : (
              "Last"
            )}
          </TableHead>
        )}
        {showCanonColumns && (
          <TableHead
            className={cn(
              hdrPad,
              wlHdr ? "center text-center" : "text-center",
              !wlHdr && "h-8 text-muted-foreground",
            )}
          >
            Tour
          </TableHead>
        )}
        {showCanonColumns && (
          <TableHead
            className={cn(
              hdrPad,
              wlHdr ? "center text-center" : "text-center",
              !wlHdr && "h-8 text-muted-foreground",
            )}
          >
            Rarity
          </TableHead>
        )}
        <TableHead
          className={cn(
            hdrPad,
            wlHdr ?
              cn("set-table-personnel-head max-w-[400px] whitespace-normal")
            : cn("h-8 w-max max-w-[300px] text-muted-foreground"),
          )}
        >
          Personnel
        </TableHead>
        <TableHead
          className={cn(
            hdrPad,
            wlHdr ?
              "set-table-coach-notes-head max-w-[400px]"
            : cn(
                "h-8 w-max max-w-[400px] text-muted-foreground",
                "py-[1px]",
              ),
          )}
        >
          Coach&apos;s Notes
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
