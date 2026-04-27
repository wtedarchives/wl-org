"use client"

import type { CSSProperties } from "react"
import { FileText } from "@phosphor-icons/react"

import { getChangeTypeIcon } from "@/components/dpro/setlist/setlist-show-change-icon"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"

/** Matches when this component renders non-null (aside spacing). */
export function isWlHomeV2SetlistShowChangesSectionVisible(
  loading: boolean,
  changes: ShowChangeRow[],
  onOpenScan?: () => void,
): boolean {
  if (loading) return true
  return changes.length > 0 || !!onOpenScan
}

export function WlHomeV2SetlistShowChangesSection({
  changes,
  loading,
  onOpenScan,
}: {
  changes: ShowChangeRow[]
  loading: boolean
  onOpenScan?: () => void
}) {
  const hasScan = !!onOpenScan

  if (loading) {
    return (
      <section
        className="wl-home-v2-years-tile"
        style={
          {
            "--tile-bg": "url('/newbg3.jpeg')",
          } as CSSProperties
        }
      >
        <div className="wl-home-v2-years-tile-inner">
          <div className="side-card">
            <div className="wl-home-v2-setlist-show-changes-head">
              <div className="sc-label">Show Changes</div>
            </div>
            <p className="wl-home-v2-setlist-show-changes-loading">Loading…</p>
          </div>
        </div>
      </section>
    )
  }

  if (!isWlHomeV2SetlistShowChangesSectionVisible(false, changes, onOpenScan)) {
    return null
  }

  return (
    <section
      className="wl-home-v2-years-tile"
      style={
        {
          "--tile-bg": "url('/newbg3.jpeg')",
        } as CSSProperties
      }
    >
      <div className="wl-home-v2-years-tile-inner">
        <div className="side-card">
          <div className="wl-home-v2-setlist-show-changes-head">
            <div className="sc-label">Show Changes</div>
            {hasScan ?
              <button
                type="button"
                className="wl-home-v2-setlist-show-changes-scan-btn"
                onClick={onOpenScan}
              >
                <FileText className="size-3.5 shrink-0" weight="bold" />
                Setlist Scan
              </button>
            : null}
          </div>
          {changes.length === 0 ?
            <p className="wl-home-v2-setlist-show-changes-empty">
              No changes from original setlist.
            </p>
          : <ul className="wl-home-v2-setlist-show-changes-list">
              {changes.map((c) => {
                const iconConfig = getChangeTypeIcon(c.change_type)
                return (
                  <li
                    key={c.show_change_uuid}
                    className="wl-home-v2-setlist-show-changes-item"
                  >
                    {iconConfig ?
                      <iconConfig.Icon
                        className={`wl-home-v2-setlist-show-changes-icon size-3.5 shrink-0 ${iconConfig.colorClass}`}
                      />
                    : null}
                    <span
                      dangerouslySetInnerHTML={{ __html: c.change }}
                    />
                  </li>
                )
              })}
            </ul>
          }
        </div>
      </div>
    </section>
  )
}
