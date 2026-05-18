"use client"

import { Fragment, forwardRef, useMemo } from "react"

import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { railLabelForEntrySet } from "@/components/wl-home-v2/wl-home-v2-setlist-table.utils"
import {
  WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX,
} from "@/lib/wl-home-v2-setlist-share-export-config"
import {
  prepareWlHomeV2ShareExportRichHtml,
} from "@/lib/wl-home-v2-share-export-rich-html"
import {
  formatSetlistDate,
  getEncoreLabel,
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
  shouldShowSetBreak,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import type { SetlistEntry, Show } from "@/types/setlist"

import "./wl-home-v2-setlist-share-export.css"

export type WlHomeV2SetlistShareExportCardProps = {
  backgroundSrc: string
  show: Show
  setlist: SetlistEntry[]
  showPositionInTour: ShowPositionInTour | null
  /** When false, per-entry coach notes under each song are omitted (preview + PNG). Default true. */
  showEntryCoachNotes?: boolean
}

export const WlHomeV2SetlistShareExportCard = forwardRef<
  HTMLDivElement,
  WlHomeV2SetlistShareExportCardProps
>(function WlHomeV2SetlistShareExportCard(
  {
    backgroundSrc,
    show,
    setlist,
    showPositionInTour,
    showEntryCoachNotes = true,
  },
  ref,
) {
  const coachNotes = show.show_coachnotes?.trim() ?? ""
  const callbacks = show.show_callbacks?.trim() ?? ""

  const showDiscographySetUi = show.discography_display !== false
  const uniquePlacements = useMemo(
    () => new Set(setlist.map((e) => e.entry_placement)),
    [setlist],
  )
  const hasSinglePlacementType = uniquePlacements.size === 1
  const shareDividerColSpan = 2

  const exportRows = useMemo(() => {
    const dividersBeforeEntryIndex = (entryIndex: number): number => {
      if (entryIndex <= 0) return 0
      let n = 0
      const prevEntry = setlist[entryIndex - 1]!
      const entry = setlist[entryIndex]!
      if (
        showDiscographySetUi &&
        !hasSinglePlacementType &&
        !!entry.entry_set?.startsWith("E") &&
        (!prevEntry.entry_set?.startsWith("E") ||
          prevEntry.entry_set !== entry.entry_set) &&
        !!getEncoreLabel(entry.entry_set)
      )
        n++
      if (
        showDiscographySetUi &&
        !hasSinglePlacementType &&
        shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)
      )
        n++
      return n
    }

    return setlist.map((entry, i) => {
      const isFirstOfRun =
        i === 0 || setlist[i - 1]!.entry_set !== entry.entry_set
      const isLastOfRun =
        i === setlist.length - 1 ||
        setlist[i + 1]!.entry_set !== entry.entry_set
      let runSpan = 1
      if (isFirstOfRun) {
        for (let j = i + 1; j < setlist.length; j++) {
          if (setlist[j]!.entry_set === entry.entry_set) runSpan++
          else break
        }
      }

      let railRowSpan = runSpan
      if (isFirstOfRun && runSpan > 1) {
        let dividerRowsBetweenSameSet = 0
        for (let j = i + 1; j < i + runSpan; j++) {
          dividerRowsBetweenSameSet += dividersBeforeEntryIndex(j)
        }
        railRowSpan = runSpan + dividerRowsBetweenSameSet
      }

      const railLabel =
        isFirstOfRun ?
          railLabelForEntrySet(entry.entry_set, runSpan)
        : null

      return {
        entry,
        index: i,
        isFirstOfRun,
        isLastOfRun,
        runSpan,
        railRowSpan,
        railLabel,
      }
    })
  }, [setlist, showDiscographySetUi, hasSinglePlacementType])

  const detailPills = useMemo(() => {
    const dateStr = formatSetlistDate(show.show_date)
    const group = show.show_group?.trim()
    const tour = show.show_tour?.trim()
    const sub = show.show_subvenue?.trim()
    const loc = show.show_venue_location?.trim()

    type Line = { text: string; muted?: boolean }
    type Pill = { key: string; lines: Line[] }
    const out: Pill[] = []

    const groupDateLines: Line[] = []
    if (group) groupDateLines.push({ text: group })
    groupDateLines.push({ text: dateStr, muted: true })
    out.push({ key: "group-date", lines: groupDateLines })

    const tourLines: Line[] = []
    if (tour) tourLines.push({ text: tour })
    if (showPositionInTour) {
      tourLines.push({
        text: `Show ${showPositionInTour.position} of ${showPositionInTour.total}`,
        muted: true,
      })
    }
    if (tourLines.length > 0) out.push({ key: "tour-pos", lines: tourLines })

    const venueLines: Line[] = []
    if (sub) venueLines.push({ text: sub })
    if (loc) venueLines.push({ text: loc, muted: true })
    if (venueLines.length > 0) out.push({ key: "sub-loc", lines: venueLines })

    return out
  }, [show, showPositionInTour])

  const rarityPctStr =
    show.show_rarity != null ?
      `${Number(show.show_rarity).toFixed(2)}%`
    : null
  const showShareExportStats =
    rarityPctStr != null || show.show_gap != null

  return (
    <div
      className="wl-home-v2-share-export__root"
      style={{
        width: WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX,
        maxWidth: WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX,
      }}
    >
      <div ref={ref} className="wl-home-v2-share-export__frame">
        <div className="wl-home-v2-share-export__bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export capture; must rasterize reliably */}
          <img
            src={backgroundSrc}
            alt=""
            crossOrigin="anonymous"
            className="wl-home-v2-share-export__bg-img"
            draggable={false}
          />
          <div className="wl-home-v2-share-export__bg-wash" />
        </div>

        <div className="wl-home-v2-share-export__body">
          <div className="wl-home-v2-share-export__brand-bar">
            <div className="wl-home-v2-share-export__brand-cluster">
              <div className="wl-home-v2-share-export__brand-mark" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element -- PNG capture; match live header mark */}
                <img
                  src="/WL.png"
                  alt=""
                  className="wl-home-v2-share-export__brand-mark-img"
                  draggable={false}
                />
              </div>
              <div className="wl-home-v2-share-export__brand-text">
                <span className="wl-home-v2-share-export__brand-title">
                  WTED Archives
                </span>
                <span className="wl-home-v2-share-export__brand-tagline">
                  Powered by Dripfield.pro
                </span>
              </div>
            </div>
          </div>

          <div className="wl-home-v2-share-export__top-split">
            <div className="wl-home-v2-share-export__top-split-main">
              <div className="wl-home-v2-share-export__table-wrap">
                <table className="wl-home-v2-share-export__table">
                  <tbody className="wl-home-v2-share-export__tbody">
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
                      shouldShowSetBreak(
                        prevEntry.entry_set,
                        entry.entry_set,
                      )

                    const shortShown = shouldShowSetlistEntryShort(
                      entry.entry_song,
                      entry.entry_short,
                    )
                    const shortRaw = entry.entry_short?.trim() ?? ""
                    const coachRaw = entry.entry_coachnotes?.trim() ?? ""
                    const encoreRail =
                      !!entry.entry_set?.startsWith("E")

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
                                {railLabel?.trim() ||
                                  String(entry.entry_set ?? "")}
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
                                      songDisplayName={
                                        entry.songs?.song_displayname
                                      }
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
                                      {entry.entry_segue
                                        .replace(/^>\s*/, "")
                                        .trim()}
                                    </span>
                                  : null}
                                </div>
                              </div>
                              {coachRaw && showEntryCoachNotes ?
                                <div
                                  className="wl-home-v2-share-export__entry-coach wl-home-v2-share-export__rich wl-home-v2-share-export__rich--entry-coach"
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      prepareWlHomeV2ShareExportRichHtml(
                                        coachRaw,
                                      ),
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
                  </tbody>
                </table>
              </div>
            </div>

            <aside
              className="wl-home-v2-share-export__top-split-aside"
              aria-label="Show details"
            >
              <div className="wl-home-v2-share-export__pills wl-home-v2-share-export__pills--stack">
                {detailPills.map((pill) => (
                  <div
                    key={pill.key}
                    className={cn(
                      "wl-home-v2-share-export__pill",
                      pill.key === "group-date" &&
                        "wl-home-v2-share-export__pill--group-date",
                    )}
                  >
                    {pill.lines.map((line, i) => (
                      <span
                        key={`${pill.key}-${i}`}
                        className={cn(
                          "wl-home-v2-share-export__pill-line",
                          line.muted &&
                            "wl-home-v2-share-export__pill-line--muted",
                        )}
                      >
                        {line.text}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              {showShareExportStats ?
                <div
                  className="wl-home-v2-share-export__show-stats"
                  aria-label="Show rarity and average gap"
                >
                  {rarityPctStr != null ?
                    <div className="wl-home-v2-share-export__show-stats-row">
                      <span className="wl-home-v2-share-export__show-stats-label">
                        Show Rarity
                      </span>
                      <span
                        className="wl-home-v2-share-export__show-stats-pill"
                        style={{
                          background:
                            getRarityPillBackground(rarityPctStr),
                          border: `1px solid ${getRarityColor(rarityPctStr)}`,
                        }}
                      >
                        {rarityPctStr}
                      </span>
                    </div>
                  : null}
                  {show.show_gap != null ?
                    <div className="wl-home-v2-share-export__show-stats-row">
                      <span className="wl-home-v2-share-export__show-stats-label">
                        Average Show Gap
                      </span>
                      <span
                        className="wl-home-v2-share-export__show-stats-pill"
                        style={{
                          background: getGapPillBackground(
                            show.show_gap,
                          ),
                          border: `1px solid ${getGapColor(show.show_gap)}`,
                        }}
                      >
                        {Number(show.show_gap).toFixed(2)}
                      </span>
                    </div>
                  : null}
                </div>
              : null}
              {coachNotes ?
                <div className="wl-home-v2-share-export__block">
                  <div
                    className="wl-home-v2-share-export__rich"
                    dangerouslySetInnerHTML={{
                      __html: prepareWlHomeV2ShareExportRichHtml(coachNotes),
                    }}
                  />
                </div>
              : null}
            </aside>
          </div>

          {callbacks ?
            <div className="wl-home-v2-share-export__block">
              <div
                className="wl-home-v2-share-export__rich"
                dangerouslySetInnerHTML={{
                  __html: prepareWlHomeV2ShareExportRichHtml(callbacks),
                }}
              />
            </div>
          : null}
        </div>
      </div>
    </div>
  )
})
