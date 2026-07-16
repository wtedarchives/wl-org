"use client"

import { Plus } from "@phosphor-icons/react"

import { SETLIST_EXPAND_BUTTON_CLASS } from "@/components/dpro/setlist/setlist-expand-button"
import { cn } from "@/lib/utils"

import "./wl-home-v2-settings.css"

type WlHomeV2SettingsSetlistPreviewProps = {
  expandedByDefault: boolean
}

function PreviewSongRow({
  song,
  showSegue = false,
  showExpand = false,
}: {
  song: string
  showSegue?: boolean
  showExpand?: boolean
}) {
  return (
    <tr className={cn("song-row", showExpand && "song-row--pair")}>
      <td className="song-cell">
        <div
          className={cn(
            "song-cell-inner",
            showExpand && "song-cell-inner--pair",
          )}
        >
          <div className="song-cell-main">
            <span>{song}</span>
            {showSegue ?
              <span className="segue" aria-hidden>
                →
              </span>
            : null}
          </div>
          {showExpand ?
            <span className="song-cell-pair-trailing">
              <span
                className={cn(
                  SETLIST_EXPAND_BUTTON_CLASS,
                  "wl-home-v2-settings-preview__expand",
                )}
                aria-hidden
              >
                <Plus className="size-3.5 text-black" weight="bold" />
              </span>
            </span>
          : null}
        </div>
      </td>
    </tr>
  )
}

/**
 * Static setlist excerpt illustrating expanded vs condensed parentheticals.
 */
export function WlHomeV2SettingsSetlistPreview({
  expandedByDefault,
}: WlHomeV2SettingsSetlistPreviewProps) {
  return (
    <div
      className="wl-home-v2-settings-preview"
      aria-label={
        expandedByDefault ?
          "Preview: parenthetical songs shown as separate rows"
        : "Preview: parenthetical songs hidden for a cleaner listing"
      }
    >
      <div className="wl-home-v2-setlist wl-home-v2-settings-preview__setlist">
        <table className="set-table">
          <tbody>
            {expandedByDefault ?
              <>
                <PreviewSongRow song="SOS" showSegue />
                <PreviewSongRow song="(dawn)" />
                <PreviewSongRow song="Savenger" showSegue />
                <PreviewSongRow song="(you are here)" showSegue />
                <PreviewSongRow song="((savengerspell))" />
                <PreviewSongRow song="So Ready" showSegue />
                <PreviewSongRow song="(s∆tellite)" />
              </>
            : <>
                <PreviewSongRow song="SOS" showExpand />
                <PreviewSongRow song="Savenger" showExpand />
                <PreviewSongRow song="So Ready" showExpand />
              </>
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
