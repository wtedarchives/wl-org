"use client"

import Link from "next/link"

import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import {
  jotyRoundDataAttr,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { PerformanceTooltipContent } from "@/components/dpro/song/performance-tooltip"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { getPlacementBarColor } from "@/lib/placement-bar-color"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { formatPerformanceLength } from "@/lib/song-performance-utils"
import { songPerformanceToWtedStubEntry } from "@/lib/song-performance-wted-stub"
import { cn } from "@/lib/utils"
import type { SongPerformance } from "@/types/song"

import { performanceVenueHref } from "@/components/archive-song/song-archive-detail-performances-lib"
import type { SongArchivePerformanceWtedPayload } from "@/components/archive-song/song-archive-detail-performances-types"

export function PerfArchiveTableRow({
  perf,
  index,
  selectedGroup,
  songCanonical,
  songDisplayName,
  showTooltips,
  onJotyClick,
  showWtedColumn,
  onWtedPayloadClick,
}: {
  perf: SongPerformance
  index: number
  selectedGroup: string | null
  songCanonical: string
  songDisplayName?: string | null
  showTooltips: boolean
  onJotyClick?: (year: number, entryId: string | null) => void
  showWtedColumn: boolean
  onWtedPayloadClick?: (payload: SongArchivePerformanceWtedPayload) => void
}) {
  const rowKey = perf.entry_id
    ? `${perf.entry_id}-${index}`
    : `${perf.show_id}-${index}`
  const shouldHighlight = Boolean(selectedGroup && perf.show_group === selectedGroup)
  const shouldMute = Boolean(selectedGroup && perf.show_group !== selectedGroup)
  const isMainSet = perf.entry_placement?.startsWith("Main Set ")
  const placementBar = isMainSet ? undefined : getPlacementBarColor(perf.entry_placement)
  const venueHref = performanceVenueHref(perf)
  const jotyRound = perf.joty_round?.trim()
  const wtedStub = songPerformanceToWtedStubEntry(
    perf,
    songCanonical,
    songDisplayName,
  )

  return (
    <tr
      className={
        shouldHighlight ? "perf-table-row--hl"
        : shouldMute ?
          "perf-table-row--muted"
        : ""
      }
    >
      <td
        className="date perf-table-td--show"
        style={{
          boxShadow: placementBar ? `inset -4px 0 0 ${placementBar}` : "none",
        }}
      >
        {showTooltips ?
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={getSetlistArchiveUrl(perf.show_id)}>
                {formatSetlistDate(perf.show_date)}
              </Link>
            </TooltipTrigger>
            <TooltipContent {...SETLIST_V2_ROW_TOOLTIP_CONTENT}>
              <PerformanceTooltipContent fullData={perf} />
            </TooltipContent>
          </Tooltip>
        : <Link href={getSetlistArchiveUrl(perf.show_id)}>
            {formatSetlistDate(perf.show_date)}
          </Link>
        }
      </td>
      <td className="dim">{perf.show_group}</td>
      <td className="venue">
        {perf.show_subvenue ?
          showTooltips ?
            <Tooltip>
              <TooltipTrigger asChild>
                {venueHref ?
                  <Link href={venueHref}>{perf.show_venue_location}</Link>
                : <span>{perf.show_venue_location}</span>}
              </TooltipTrigger>
              <TooltipContent
                {...SETLIST_V2_ROW_TOOLTIP_CONTENT}
                className={cn(
                  SETLIST_V2_ROW_TOOLTIP_CONTENT.className,
                  "setlist-header-tooltip--tight",
                )}
              >
                <div
                  className="[&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: perf.show_subvenue }}
                />
              </TooltipContent>
            </Tooltip>
          : venueHref ?
            <Link href={venueHref}>{perf.show_venue_location}</Link>
          : perf.show_venue_location
        : venueHref ?
          <Link href={venueHref}>{perf.show_venue_location}</Link>
        : perf.show_venue_location}
      </td>
      <td className="perf-table-td--song">
        {perf.entry_song && perf.entry_song !== ">" ?
          <span className="perf-table-song-main">
            <span className="perf-table-song-title">
              <SongDisplayName
                song={songCanonical}
                songDisplayName={songDisplayName}
                underlineOnHover={false}
              />
            </span>
            {shouldShowSetlistEntryShort(
              perf.entry_song ?? songCanonical,
              perf.entry_short,
            ) && perf.entry_short ?
              <span className="short">{perf.entry_short}</span>
            : null}
            {perf.entry_segue ?
              <span className="perf-table-song-segue">→</span>
            : null}
          </span>
        : <Link
            href={getSetlistArchiveUrl(perf.show_id)}
            className="perf-table-song-tease"
          >
            &gt;
          </Link>
        }
      </td>
      {showWtedColumn ?
        <td className="dim perf-table-td--center perf-table-td--wted">
          <SetlistEntryWtedCell
            entry={wtedStub}
            onWtedClick={
              onWtedPayloadClick ?
                (entry) =>
                  onWtedPayloadClick({
                    entry,
                    show: {
                      show_date: perf.show_date,
                      show_venue_location: perf.show_venue_location,
                      show_group: perf.show_group,
                    },
                  })
              : undefined
            }
            showTooltips={showTooltips}
            tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
          />
        </td>
      : null}
      <td className="dim perf-table-td--center">{perf.entry_set || ""}</td>
      <td className="perf-table-td--center perf-table-td--joty">
        {jotyRound ?
          <button
            type="button"
            className="joty-pill"
            data-joty-round={jotyRoundDataAttr(jotyRound)}
            onClick={() => {
              const year = new Date(perf.show_date).getFullYear()
              if (onJotyClick) onJotyClick(year, perf.entry_id ?? null)
              else window.location.href = "https://jotyoftheyear.com"
            }}
            aria-label={`Jam of the Year: ${jotyRound}`}
          >
            {jotyRound}
          </button>
        : null}
      </td>
      <td className="dim perf-table-td--center">
        {perf.gap !== null && perf.gap !== undefined ?
          perf.gap === "Debut" ?
            <span className="perf-table-gap-debut">Debut</span>
          : String(perf.gap)
        : ""}
      </td>
      <td className="dim perf-table-td--center">
        {perf.entry_length ? formatPerformanceLength(perf.entry_length) : ""}
      </td>
      <td className="perf-table-td--personnel">
        {perf.guests?.length ?
          <SetlistTruncatableCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${rowKey}-guests`}
            expandLabel="Show all personnel"
          >
            <SetlistEntryGuestsCell
              entry={{ guests: perf.guests }}
              showTooltips={showTooltips}
              useWlHomeV2PillStyle
              tooltipContentClassName={
                SETLIST_V2_ROW_TOOLTIP_CONTENT.className
              }
            />
          </SetlistTruncatableCell>
        : null}
      </td>
      <td className="perf-table-td--coach">
        {perf.entry_coachnotes?.trim() ?
          <SetlistTruncatableHtmlCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${rowKey}-coach`}
            html={perf.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
            htmlContentClassName="setlist-v2-notes-html"
            blockPlainClassName="setlist-v2-notes-plain"
          />
        : null}
      </td>
    </tr>
  )
}
