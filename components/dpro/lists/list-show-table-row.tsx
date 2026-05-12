"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import Link from "next/link"
import { Check as PhosphorCheck } from "@phosphor-icons/react"
import { Check } from "lucide-react"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  formatLengthAsHmmss,
} from "@/lib/setlist-utils"
import type { WysteriaSession } from "@/lib/jwt"
import type { ListShow } from "@/hooks/use-list-show-data"
import { formatListShowTableDate } from "@/components/dpro/lists/list-show-table-utils"
import { ListShowTableCategoryArtworkCell } from "@/components/dpro/lists/list-show-table-row-category-cell"
import { ListShowTableRowFromRarity } from "@/components/dpro/lists/list-show-table-row-from-rarity"
import { cn } from "@/lib/utils"

export interface ListShowTableRowProps {
  show: ListShow
  index: number
  rating: number
  attendedShowIds: string[]
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
  attendeeCounts: Record<string, number>
  categoryArtwork?: Record<string, string>
  showCategoryColumn?: boolean
  showRanking?: boolean
  showRarityColumn?: boolean
  showGapColumn?: boolean
  wlHomeV2?: boolean
  user: WysteriaSession | null
}

export function ListShowTableRow({
  show,
  index,
  rating,
  attendedShowIds,
  showsWithSetlists,
  showsWithReleases,
  attendeeCounts,
  categoryArtwork,
  showCategoryColumn,
  showRanking,
  showRarityColumn = true,
  showGapColumn = true,
  wlHomeV2 = false,
  user,
}: ListShowTableRowProps) {
  const displayRank = (show as { displayRank?: number }).displayRank

  const px = wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1"
  const pxt = wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1"
  const textSize = wlHomeV2 ? "text-[11px]" : "text-xs"

  const rarityPctStr =
    show.show_rarity != null && String(show.show_rarity).trim() !== "" ?
      String(show.show_rarity).trim()
    : null

  const gapNumeric =
    show.show_gap != null && String(show.show_gap).trim() !== "" ?
      Number.parseFloat(String(show.show_gap).trim())
    : NaN

  const iconCol = wlHomeV2 ? "w-[32px]" : "w-[28px]"

  return (
    <TableRow
      className={cn(
        wlHomeV2 ?
          "border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
        : index % 2 === 0 ?
          "bg-background/70"
        : "bg-background",
      )}
    >
      {showRanking && (
        <TableCell
          className={cn(
            "text-center font-medium tabular-nums",
            textSize,
            px,
          )}
        >
          {displayRank ?? ""}
        </TableCell>
      )}
      <TableCell
        className={cn(
          "whitespace-nowrap text-center font-medium tabular-nums",
          textSize,
          px,
        )}
      >
        <Link href={getSetlistArchiveUrl(show.show_id)} className="hover:underline">
          {formatListShowTableDate(show.show_date)}
        </Link>
      </TableCell>
      {user && (
        <TableCell
          className={cn(
            "w-[32px] text-center align-middle leading-none",
            pxt,
          )}
        >
          <div className="inline-flex items-center justify-center">
            {attendedShowIds.includes(show.show_id) ?
              <div
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-emerald-600",
                  wlHomeV2 ? "size-4" : "p-0.5",
                )}
              >
                {wlHomeV2 ?
                  <PhosphorCheck
                    className="size-3 text-white"
                    weight="bold"
                    aria-hidden
                  />
                : <Check className="size-3 text-white" strokeWidth={3} />}
              </div>
            : <span
                className={cn("inline-block", wlHomeV2 ? "size-4" : "size-3")}
                aria-hidden
              />
            }
          </div>
        </TableCell>
      )}
      {showCategoryColumn && categoryArtwork && show.show_listcategorycomplete && (
        <ListShowTableCategoryArtworkCell
          show={show}
          categoryArtwork={categoryArtwork}
          pxt={pxt}
        />
      )}
      <TableCell className={cn("text-left", textSize, px)}>
        {show.tour_id ?
          <Link
            href={getTourArchiveUrl(show.tour_id)}
            className="hover:underline"
          >
            {show.show_tour}
          </Link>
        : <span>{show.show_tour}</span>}
      </TableCell>
      <TableCell
        className={cn("text-center tabular-nums", textSize, px)}
      >
        {show.show_length && show.show_length !== "-" ?
          formatLengthAsHmmss(show.show_length) ?? ""
        : ""}
      </TableCell>
      <ListShowTableRowFromRarity
        show={show}
        rating={rating}
        showsWithSetlists={showsWithSetlists}
        showsWithReleases={showsWithReleases}
        attendeeCounts={attendeeCounts}
        showRarityColumn={showRarityColumn}
        showGapColumn={showGapColumn}
        wlHomeV2={wlHomeV2}
        px={px}
        pxt={pxt}
        textSize={textSize}
        iconCol={iconCol}
        rarityPctStr={rarityPctStr}
        gapNumeric={gapNumeric}
      />
    </TableRow>
  )
}
