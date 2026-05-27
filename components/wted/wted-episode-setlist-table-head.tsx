"use client"

import {
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { DISPLAY_SETLIST_TABLE_CELL_PAD } from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SETLIST_HEADER_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { cn } from "@/lib/utils"

export function WtedEpisodeSetlistTableHead({
  showGroupColumn,
  showWtedColumn,
  isDesktop,
  wlHomeV2SetlistChrome: wl,
}: {
  showGroupColumn: boolean
  showWtedColumn: boolean
  isDesktop: boolean
  wlHomeV2SetlistChrome?: boolean
}) {
  const hdrPad = DISPLAY_SETLIST_TABLE_CELL_PAD
  return (
    <TableRow
      className={cn(
        "hover:bg-transparent",
        wl ? "border-0 !h-auto min-h-0" : "h-8 border-border/60",
      )}
    >
      <TableHead
        className={cn(
          hdrPad,
          wl && "center num-col shrink-0 text-center",
          !wl && "h-8 w-4 shrink-0 text-center text-muted-foreground",
        )}
      >
        #
      </TableHead>
      <TableHead
        className={cn(hdrPad, !wl && "h-8 text-muted-foreground")}
      >
        Song
      </TableHead>
      <TableHead
        className={cn(
          hdrPad,
          "text-center",
          wl && "center",
          !wl && "h-8 text-muted-foreground",
        )}
      >
        Date
      </TableHead>
      <TableHead
        className={cn(hdrPad, !wl && "h-8 text-muted-foreground")}
      >
        Location
      </TableHead>
      {showWtedColumn ?
        <TableHead
          className={cn(
            hdrPad,
            "text-center",
            wl && "center",
            !wl && "h-8 text-muted-foreground",
          )}
        >
          {isDesktop ?
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(!wl && "cursor-help", wl && "setlist-th-help")}
                >
                  WTED
                </span>
              </TooltipTrigger>
              <TooltipContent
                {...(wl ?
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
          : "WTED"}
        </TableHead>
      : null}
      <TableHead
        className={cn(
          hdrPad,
          "text-center",
          wl && "center",
          !wl && "h-8 text-muted-foreground",
        )}
      >
        Time
      </TableHead>
      {showGroupColumn ?
        <TableHead
          className={cn(
            hdrPad,
            wl ? "center text-center" : "text-center",
            !wl && "h-8 text-muted-foreground",
          )}
        >
          Group
        </TableHead>
      : null}
      <TableHead
        className={cn(
          hdrPad,
          wl ?
            "set-table-personnel-head max-w-[400px] whitespace-normal"
          : cn("h-8 w-max max-w-[300px] text-muted-foreground"),
        )}
      >
        Personnel
      </TableHead>
      <TableHead
        className={cn(
          hdrPad,
          wl ?
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
  )
}
