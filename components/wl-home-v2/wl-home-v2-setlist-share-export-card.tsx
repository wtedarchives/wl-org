"use client"

import { forwardRef, useMemo } from "react"

import {
  buildShareExportDetailPills,
  buildShareExportRows,
} from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card.lib"
import { WlHomeV2SetlistShareExportAside } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-aside"
import { WlHomeV2SetlistShareExportTableBody } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-table-body"
import { WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX } from "@/lib/wl-home-v2-setlist-share-export-config"
import { prepareWlHomeV2ShareExportRichHtml } from "@/lib/wl-home-v2-share-export-rich-html"
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

  const exportRows = useMemo(
    () =>
      buildShareExportRows(
        setlist,
        showDiscographySetUi,
        hasSinglePlacementType,
      ),
    [setlist, showDiscographySetUi, hasSinglePlacementType],
  )

  const detailPills = useMemo(
    () => buildShareExportDetailPills(show, showPositionInTour),
    [show, showPositionInTour],
  )

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
              </div>
            </div>
          </div>

          <div className="wl-home-v2-share-export__top-split">
            <div className="wl-home-v2-share-export__top-split-main">
              <div className="wl-home-v2-share-export__table-wrap">
                <table className="wl-home-v2-share-export__table">
                  <tbody className="wl-home-v2-share-export__tbody">
                    <WlHomeV2SetlistShareExportTableBody
                      setlist={setlist}
                      exportRows={exportRows}
                      showDiscographySetUi={showDiscographySetUi}
                      hasSinglePlacementType={hasSinglePlacementType}
                      showEntryCoachNotes={showEntryCoachNotes}
                      shareDividerColSpan={shareDividerColSpan}
                    />
                  </tbody>
                </table>
              </div>
            </div>

            <WlHomeV2SetlistShareExportAside
              detailPills={detailPills}
              show={show}
              coachNotes={coachNotes}
              showShareExportStats={showShareExportStats}
              rarityPctStr={rarityPctStr}
            />
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
