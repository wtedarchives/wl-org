"use client"

import Image from "next/image"
import Link from "next/link"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Check } from "lucide-react"
import type { SetlistEntry, GuestGroup } from "@/types/setlist"
import {
  getLastCountBadgeStyle,
  getPlacementIndexCellBg,
  getJotyBadgeStyle,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  getPersonnelPillClassName,
  formatEntryLength,
  calculateRarity,
  getRarityColor,
} from "@/lib/setlist-utils"
import { formatSetlistDate } from "@/lib/setlist-utils"

export interface SetlistEntryRowProps {
  entry: SetlistEntry
  displayNumber: number | null
  guestGroups: GuestGroup[] // passed from parent; row colors by guest_category now
  showCanonColumns: boolean
  showWtedColumn: boolean
  onWtedClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  showAdminUi?: boolean
  /** When true (desktop), show tooltip on hover over Song cell. */
  showSongRowTooltip?: boolean
}

export function SetlistEntryRow({
  entry,
  displayNumber,
  guestGroups: _guestGroups,
  showCanonColumns,
  showWtedColumn,
  onWtedClick,
  onSongClick,
  onJotyClick,
  copiedEntryIds,
  onNumberClick,
  showAdminUi,
  showSongRowTooltip,
}: SetlistEntryRowProps) {
  const rarity = calculateRarity(
    entry.times_played_num,
    entry.shows_since_debut_num
  )
  const rarityColor = getRarityColor(rarity || null)
  const indexCellBg = getPlacementIndexCellBg(entry.entry_placement ?? null)
  const lastBadgeStyle = getLastCountBadgeStyle(entry.last_count)
  const isCopied = copiedEntryIds?.has(entry.entry_id) ?? false
  const canCopyNumber = showAdminUi && !!onNumberClick

  const numberCellContent = isCopied ? (
    <span className="inline-flex items-center justify-center text-white" aria-label="Copied">
      <Check className="size-3" />
    </span>
  ) : displayNumber !== null ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block cursor-default">{displayNumber}</span>
      </TooltipTrigger>
      <TooltipContent>
        {entry.entry_placement || `Song ${displayNumber}`}
      </TooltipContent>
    </Tooltip>
  ) : null

  return (
    <TableRow className="border-border/60">
      <TableCell
        className={`text-center tabular-nums ${isCopied ? "bg-green-600 text-white" : indexCellBg !== "transparent" ? "text-white" : "text-muted-foreground"}`}
        style={{
          backgroundColor: isCopied ? undefined : indexCellBg !== "transparent" ? indexCellBg : undefined,
        }}
      >
        {canCopyNumber ? (
          <button
            type="button"
            onClick={() => onNumberClick(entry.entry_id)}
            className="inline-flex min-w-[1rem] cursor-pointer items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-ring"
            title="Copy entry ID"
          >
            {numberCellContent}
          </button>
        ) : (
          numberCellContent
        )}
      </TableCell>
      <TableCell>
        {showSongRowTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-nowrap items-center gap-2">
                <span className="font-medium">
                  {onSongClick ? (
                    <button
                      type="button"
                      onClick={() => onSongClick(entry)}
                      className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded pr-1"
                    >
                      {entry.entry_song}
                    </button>
                  ) : (
                    entry.entry_song
                  )}
                  {entry.entry_short && (
                    <span className="ml-1 text-red-400 text-[0.625rem] pr-1">[{entry.entry_short}]</span>
                  )}
                  {entry.entry_segue && (
                    <span className="ml-1 text-red-400">
                      → {entry.entry_segue.replace(/^>\s*/, "").trim()}
                    </span>
                  )}
                </span>
                {entry.joty_round && (() => {
                  const jotyStyle = getJotyBadgeStyle(entry.joty_round!)
                  return onJotyClick ? (
                    <button
                      type="button"
                      onClick={() => onJotyClick(entry)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <span
                        style={jotyStyle.style}
                        className={`${jotyStyle.className} cursor-pointer`}
                      >
                        {entry.joty_round}
                      </span>
                    </button>
                  ) : (
                    <span
                      style={jotyStyle.style}
                      className={jotyStyle.className}
                    >
                      {entry.joty_round}
                    </span>
                  )
                })()}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-xs text-background">
              <div className="space-y-1.5">
                <div className="font-medium text-background">
                  {entry.entry_song}
                  {entry.entry_short && (
                    <span className="ml-1 text-[0.625rem] text-red-400 pr-1">
                      [{entry.entry_short}]
                    </span>
                  )}
                  {entry.entry_segue && (
                    <span className="ml-1 text-red-400">
                      → {entry.entry_segue.replace(/^>\s*/, "").trim()}
                    </span>
                  )}
                </div>
                {entry.times_played && (
                  <div
                    className="text-background/80 [&_a]:underline [&_a]:text-background"
                    dangerouslySetInnerHTML={{ __html: entry.times_played }}
                  />
                )}
                {entry.shows_since_debut && (
                  <div
                    className="text-background/80 [&_a]:underline [&_a]:text-background"
                    dangerouslySetInnerHTML={{ __html: entry.shows_since_debut }}
                  />
                )}
                {entry.song_rarity_percentage && (
                  <div
                    className="text-background/80 [&_a]:underline [&_a]:text-background"
                    dangerouslySetInnerHTML={{ __html: entry.song_rarity_percentage }}
                  />
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex flex-nowrap items-center gap-2">
            <span className="font-medium">
              {onSongClick ? (
                <button
                  type="button"
                  onClick={() => onSongClick(entry)}
                  className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded pr-1"
                >
                  {entry.entry_song}
                </button>
              ) : (
                entry.entry_song
              )}
              {entry.entry_short && (
                <span className="ml-1 text-red-400 text-[0.625rem] pr-1">[{entry.entry_short}]</span>
              )}
              {entry.entry_segue && (
                <span className="ml-1 text-red-400">
                  → {entry.entry_segue.replace(/^>\s*/, "").trim()}
                </span>
              )}
            </span>
            {entry.joty_round && (() => {
              const jotyStyle = getJotyBadgeStyle(entry.joty_round!)
              return onJotyClick ? (
                <button
                  type="button"
                  onClick={() => onJotyClick(entry)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <span
                    style={jotyStyle.style}
                    className={`${jotyStyle.className} cursor-pointer`}
                  >
                    {entry.joty_round}
                  </span>
                </button>
              ) : (
                <span
                  style={jotyStyle.style}
                  className={jotyStyle.className}
                >
                  {entry.joty_round}
                </span>
              )
            })()}
          </div>
        )}
      </TableCell>
      {showWtedColumn && (
        <TableCell className="text-center">
          {entry.radio_id ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {onWtedClick ? (
                  <button
                    type="button"
                    onClick={() => onWtedClick(entry)}
                    className="rounded p-0.5 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                    aria-label="Request this song on WTED Goose Radio"
                  >
                    <Image
                      src="/WTED2.png"
                      alt="WTED"
                      width={20}
                      height={20}
                      className="size-3"
                    />
                  </button>
                ) : (
                  <span className="inline-block">
                    <Image
                      src="/WTED2.png"
                      alt="WTED"
                      width={20}
                      height={20}
                      className="size-5"
                    />
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent>Request this song on WTED Goose Radio.</TooltipContent>
            </Tooltip>
          ) : null}
        </TableCell>
      )}
      <TableCell className="text-center tabular-nums text-muted-foreground">
        {formatEntryLength(entry.entry_length) ?? ""}
      </TableCell>
      {showCanonColumns && (
        <TableCell className="text-center text-muted-foreground">
          {entry.last_count != null && entry.last_count !== "" ? (
            entry.last_show_id ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/dpro/setlist/${entry.last_show_id}`}
                    className="cursor-pointer hover:underline"
                  >
                    {lastBadgeStyle ? (
                      <span className={lastBadgeStyle.className}>
                        {entry.last_count}
                      </span>
                    ) : (
                      entry.last_count
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-xs">
                  <div className="space-y-0.5">
                    {entry.last_show_date && (
                      <div>
                        <span className="font-semibold">
                          {formatSetlistDate(entry.last_show_date)}
                        </span>
                      </div>
                    )}
                    {entry.last_venue_location && (
                      <div>{entry.last_venue_location}</div>
                    )}
                    {entry.last_show_tour && (
                      <div>{entry.last_show_tour}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : lastBadgeStyle ? (
              <span className={lastBadgeStyle.className}>
                {entry.last_count}
              </span>
            ) : (
              entry.last_count
            )
          ) : null}
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell className="text-center tabular-nums text-muted-foreground">
          {entry.song_tour_count ?? ""}
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell className="text-center">
          {rarity ? (
            <span
              className="inline-flex justify-center rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: rarityColor }}
            >
              {rarity}
            </span>
          ) : null}
        </TableCell>
      )}
      <TableCell className="min-w-[225px] max-w-[400px]">
        {entry.guests?.length ? (
          <div className="flex flex-wrap gap-0.5">
            {[...entry.guests]
              .sort((a, b) => a.guest_canonid - b.guest_canonid)
              .map((g) => (
                <Tooltip key={g.guest_id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/dpro/personnel/${g.guest_id}`}
                      className={`${getPersonnelPillClassName(g.guest_category)} no-underline hover:opacity-90`}
                    >
                      {g.guest_display_name}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>{g.guest_instrument || "Personnel"}</TooltipContent>
                </Tooltip>
              ))}
          </div>
        ) : null}
      </TableCell>
      <TableCell className="min-w-[400px] max-w-[400px] whitespace-normal text-muted-foreground">
        {entry.entry_coachnotes ? (
          <span
            className="text-[10px] text-left [&_a]:font-medium [&_a]:text-wl-orange [&_a]:underline [&_a]:hover:text-wl-light-orange"
            dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes }}
          />
        ) : null}
      </TableCell>
    </TableRow>
  )
}
