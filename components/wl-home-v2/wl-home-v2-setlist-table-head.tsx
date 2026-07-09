"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SETLIST_HEADER_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import {
  WlHomeV2LastHeaderTooltipBody,
  WlHomeV2SetlistSongHeaderTooltipBody,
} from "@/components/wl-home-v2/wl-home-v2-setlist-table-header-tooltips"

type WlHomeV2SetlistTableHeadProps = {
  showDiscographySetUi: boolean
  showWtedColumn: boolean
  showBandcampColumn: boolean
  showTimeColumn: boolean
  showCanonColumns: boolean
  showCoachColumn: boolean
  isDesktop: boolean
  hasSongHeaderTooltipItems: boolean
  hasSegue: boolean
  sortedShorts: string[]
  jotyRoundsInOrder: string[]
  shortLabelByKey: Map<string, string>
  hasLastHeaderTooltip: boolean
}

export function WlHomeV2SetlistTableHead({
  showDiscographySetUi,
  showWtedColumn,
  showBandcampColumn,
  showTimeColumn,
  showCanonColumns,
  showCoachColumn,
  isDesktop,
  hasSongHeaderTooltipItems,
  hasSegue,
  sortedShorts,
  jotyRoundsInOrder,
  shortLabelByKey,
  hasLastHeaderTooltip,
}: WlHomeV2SetlistTableHeadProps) {
  return (
    <thead>
      <tr>
        {showDiscographySetUi ?
          <th className="set-section-rail-head" scope="col" aria-hidden={true} />
        : null}
        <th className="center num-col">#</th>
        <th>
          {hasSongHeaderTooltipItems && isDesktop ?
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="setlist-th-help">Song</span>
              </TooltipTrigger>
              <TooltipContent
                className="setlist-header-tooltip"
                {...SETLIST_HEADER_TOOLTIP_CONTENT}
              >
                <WlHomeV2SetlistSongHeaderTooltipBody
                  hasSegue={hasSegue}
                  sortedShorts={sortedShorts}
                  jotyRoundsInOrder={jotyRoundsInOrder}
                  shortLabelByKey={shortLabelByKey}
                />
              </TooltipContent>
            </Tooltip>
          : "Song"}
        </th>
        {showWtedColumn ?
          <th className="center">
            {isDesktop ?
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="setlist-th-help">WTED</span>
                </TooltipTrigger>
                <TooltipContent
                  className="setlist-header-tooltip setlist-header-tooltip--tight"
                  {...SETLIST_HEADER_TOOLTIP_CONTENT}
                >
                  Use the icons below to request songs on WTED Goose Radio.
                </TooltipContent>
              </Tooltip>
            : "WTED"}
          </th>
        : null}
        {showBandcampColumn ?
          <th className="center">
            {isDesktop ?
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="setlist-th-help">Bandcamp</span>
                </TooltipTrigger>
                <TooltipContent
                  className="setlist-header-tooltip setlist-header-tooltip--tight"
                  {...SETLIST_HEADER_TOOLTIP_CONTENT}
                >
                  Use the icons below to play songs on Bandcamp.
                </TooltipContent>
              </Tooltip>
            : "Bandcamp"}
          </th>
        : null}
        {showTimeColumn ?
          <th className="center">Time</th>
        : null}
        {showCanonColumns ?
          <th className="center">
            {hasLastHeaderTooltip && isDesktop ?
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="setlist-th-help">Last</span>
                </TooltipTrigger>
                <TooltipContent
                  className="setlist-header-tooltip setlist-header-tooltip--last"
                  {...SETLIST_HEADER_TOOLTIP_CONTENT}
                >
                  <WlHomeV2LastHeaderTooltipBody />
                </TooltipContent>
              </Tooltip>
            : "Last"}
          </th>
        : null}
        {showCanonColumns ?
          <th className="center">Tour</th>
        : null}
        {showCanonColumns ?
          <th className="center">Rarity</th>
        : null}
        <th className="set-table-personnel-head">Personnel</th>
        {showCoachColumn ?
          <th className="set-table-coach-notes-head">Coach&apos;s Notes</th>
        : null}
      </tr>
    </thead>
  )
}
