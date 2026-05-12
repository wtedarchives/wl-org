"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  TableCell,
} from "@/components/ui/table"
import type { ListShow } from "@/hooks/use-list-show-data"
import { cn } from "@/lib/utils"

export function ListShowTableCategoryArtworkCell({
  show,
  categoryArtwork,
  pxt,
}: {
  show: ListShow
  categoryArtwork: Record<string, string>
  pxt: string
}) {
  if (!show.show_listcategorycomplete) return null

  return (
    <TableCell
      className={cn(
        "list-show-table__art-cell min-w-12 w-12",
        pxt,
      )}
    >
      <div className="list-show-table__art-cell-inner">
        {categoryArtwork[show.show_listcategorycomplete] ?
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center">
                  <img
                    src={categoryArtwork[show.show_listcategorycomplete]}
                    alt={show.show_listcategorycomplete}
                    className="list-show-table__category-thumb mx-auto size-5 rounded object-cover border border-border"
                    onError={(e) => {
                      e.currentTarget.classList.add(
                        "list-show-table__category-thumb--failed",
                      )
                    }}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={4}
                className="max-w-[200px]"
              >
                <span className="text-xs">
                  {show.show_listcategorycomplete}
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        : null}
      </div>
    </TableCell>
  )
}
