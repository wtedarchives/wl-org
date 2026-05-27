"use client"

import { Fragment } from "react"

import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { ShareExportRow } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card.lib"
import { prepareWlHomeV2ShareExportRichHtml } from "@/lib/wl-home-v2-share-export-rich-html"
import { getEncoreLabel, shouldShowSetBreak } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

export function WlHomeV2SetlistShareExportTableBody({
  setlist,
  exportRows,
  showDiscographySetUi,
  hasSinglePlacementType,
  showEntryCoachNotes,
  shareDividerColSpan,
}: {
  setlist: SetlistEntry[]
  exportRows: ShareExportRow[]
  showDiscographySetUi: boolean
  hasSinglePlacementType: boolean
  showEntryCoachNotes: boolean
  shareDividerColSpan: number
}) {
  return (
    <>
      {exportRows.map(
        ({
          entry,
          index: i,
          isFirstOfRun,
          isLastOfRun,
          railRowSpan,
          railLabel,
        }) => {
          const prevEntry = i > 0 ? setlist[i - 1]! : null
          const showEncoreBar =
            showDiscographySetUi &&
            !hasSinglePlacementType &&
            !!prevEntry &&
            !!entry.entry_set?.startsWith("E") &&
            (!prevEntry.entry_set?.startsWith("E") ||
              prevEntry.entry_set !== entry.entry_set) &&
            !!getEncoreLabel(entry.entry_set)
          const showSetBreakBar =
            showDiscographySetUi &&
            !hasSinglePlacementType &&
            !!prevEntry &&
            shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)

          const shortShown = shouldShowSetlistEntryShort(
            entry.entry_song,
            entry.entry_short,
          )
          const shortRaw = entry.entry_short?.trim() ?? ""
          const coachRaw = entry.entry_coachnotes?.trim() ?? ""
          const encoreRail = !!entry.entry_set?.startsWith("E")

          return (
            <Fragment key={entry.entry_id}>
              {showEncoreBar ?
                <tr
                  className="wl-home-v2-share-export__divider-row wl-home-v2-share-export__divider-row--encore"
                  aria-hidden
                >
                  <td
                    className="wl-home-v2-share-export__divider-cell"
                    colSpan={shareDividerColSpan}
                  />
                </tr>
              : null}
              {showSetBreakBar ?
                <tr
                  className="wl-home-v2-share-export__divider-row"
                  aria-hidden
                >
                  <td
                    className="wl-home-v2-share-export__divider-cell"
                    colSpan={shareDividerColSpan}
                  />
                </tr>
              : null}
              <tr className="wl-home-v2-share-export__song-row">
                {isFirstOfRun ?
                  <td
                    className={
                      encoreRail ?
                        "wl-home-v2-share-export__rail wl-home-v2-share-export__rail--encore"
                      : "wl-home-v2-share-export__rail"
                    }
                    rowSpan={railRowSpan}
                  >
                    <span className="wl-home-v2-share-export__rail-text">
                      {railLabel?.trim() || String(entry.entry_set ?? "")}
                    </span>
                  </td>
                : null}
                <td className="wl-home-v2-share-export__song-cell">
                  <div
                    className={cn(
                      "wl-home-v2-share-export__song-cell-stack",
                      isFirstOfRun &&
                        "wl-home-v2-share-export__song-cell-stack--set-first",
                      isLastOfRun &&
                        "wl-home-v2-share-export__song-cell-stack--set-last",
                    )}
                  >
                    <div className="wl-home-v2-share-export__song-cell-inner">
                      <div className="wl-home-v2-share-export__song-cell-main">
                        <span className="wl-home-v2-share-export__song-name-slot">
                          <SongDisplayName
                            song={entry.entry_song}
                            songDisplayName={entry.songs?.song_displayname}
                            underlineOnHover={false}
                            compactInline
                          />
                        </span>
                        {shortShown && shortRaw ?
                          <span className="wl-home-v2-share-export__short">
                            {shortRaw}
                          </span>
                        : null}
                        {entry.entry_segue ?
                          <span className="wl-home-v2-share-export__segue">
                            →{" "}
                            {entry.entry_segue.replace(/^>\s*/, "").trim()}
                          </span>
                        : null}
                      </div>
                    </div>
                    {coachRaw && showEntryCoachNotes ?
                      <div
                        className="wl-home-v2-share-export__entry-coach wl-home-v2-share-export__rich wl-home-v2-share-export__rich--entry-coach"
                        dangerouslySetInnerHTML={{
                          __html: prepareWlHomeV2ShareExportRichHtml(coachRaw),
                        }}
                      />
                    : null}
                  </div>
                </td>
              </tr>
            </Fragment>
          )
        },
      )}
    </>
  )
}
