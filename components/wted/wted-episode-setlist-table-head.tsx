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
import { cn } from "@/lib/utils"

export function WtedEpisodeSetlistTableHead({
  showGroupColumn,
  showWtedColumn,
  isDesktop,
}: {
  showGroupColumn: boolean
  showWtedColumn: boolean
  isDesktop: boolean
}) {
  return (
    <TableRow className="h-8 border-border/60 hover:bg-transparent">
      <TableHead
        className={cn(
          "h-8 w-4 shrink-0 text-center text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        #
      </TableHead>
      <TableHead
        className={cn("h-8 text-muted-foreground", DISPLAY_SETLIST_TABLE_CELL_PAD)}
      >
        Song
      </TableHead>
      <TableHead
        className={cn(
          "h-8 whitespace-nowrap text-center text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        Date
      </TableHead>
      <TableHead
        className={cn("h-8 text-muted-foreground", DISPLAY_SETLIST_TABLE_CELL_PAD)}
      >
        Location
      </TableHead>
      {showWtedColumn ?
        <TableHead
          className={cn(
            "h-8 text-center text-muted-foreground",
            DISPLAY_SETLIST_TABLE_CELL_PAD,
          )}
        >
          {isDesktop ?
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">WTED</span>
              </TooltipTrigger>
              <TooltipContent>
                Use the icons below to request songs on WTED Goose Radio.
              </TooltipContent>
            </Tooltip>
          : "WTED"}
        </TableHead>
      : null}
      <TableHead
        className={cn(
          "h-8 text-center text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        Time
      </TableHead>
      {showGroupColumn ?
        <TableHead
          className={cn(
            "h-8 text-center text-muted-foreground",
            DISPLAY_SETLIST_TABLE_CELL_PAD,
          )}
        >
          Group
        </TableHead>
      : null}
      <TableHead
        className={cn(
          "h-8 w-max max-w-[300px] text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        Personnel
      </TableHead>
      <TableHead
        className={cn(
          "h-8 w-max max-w-[400px] text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "py-[1px]",
        )}
      >
        Coach&apos;s Notes
      </TableHead>
    </TableRow>
  )
}
