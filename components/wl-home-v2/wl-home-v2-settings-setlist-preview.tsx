"use client"

import { Plus } from "@phosphor-icons/react"

import { SETLIST_EXPAND_BUTTON_CLASS } from "@/components/dpro/setlist/setlist-expand-button"
import { cn } from "@/lib/utils"

import "./wl-home-v2-settings.css"

type WlHomeV2SettingsSetlistPreviewProps = {
  expandedByDefault: boolean
}

function PreviewInterludeShort({ label }: { label: string }) {
  return <span className="setlist-alt-name-pill">{label}</span>
}

function PreviewCombinedInterludeRow({
  interlude,
  song,
  songFirst = false,
}: {
  interlude: string
  song: string
  /** When true, song name precedes the pill (e.g. SOS + dawn). */
  songFirst?: boolean
}) {
  const pill = <PreviewInterludeShort label={interlude} />
  const songName = <span>{song}</span>
  return (
    <tr className="song-row">
      <td className="song-cell">
        <div className="song-cell-inner song-cell-inner--pair">
          <div className="song-cell-main">
            {songFirst ?
              <>
                {songName}
                {pill}
              </>
            : <>
                {pill}
                {songName}
              </>
            }
            <span className="segue" aria-hidden>
              →
            </span>
          </div>
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
        </div>
      </td>
    </tr>
  )
}

function PreviewExpandedInterludeRows({
  interlude,
  song,
  songFirst = false,
}: {
  interlude: string
  song: string
  songFirst?: boolean
}) {
  const firstLabel = songFirst ? song : interlude
  const secondLabel = songFirst ? interlude : song
  return (
    <>
      <tr className="song-row">
        <td className="song-cell">
          <div className="song-cell-inner">
            <div className="song-cell-main">
              <span>{firstLabel}</span>
              <span className="segue" aria-hidden>
                →
              </span>
            </div>
          </div>
        </td>
      </tr>
      <tr className="song-row">
        <td className="song-cell">
          <div className="song-cell-inner">
            <div className="song-cell-main">
              <span>{secondLabel}</span>
              <span className="segue" aria-hidden>
                →
              </span>
            </div>
          </div>
        </td>
      </tr>
    </>
  )
}

function PreviewSuitePill() {
  return (
    <span className="setlist-alt-name-pill" data-alt-name-pill="suite">
      Suite
    </span>
  )
}

function PreviewRepriseShort() {
  return <span className="short">reprise</span>
}

function PreviewAutumnMadhuvanCombinedRow() {
  return (
    <tr className="song-row">
      <td className="song-cell">
        <div className="song-cell-inner song-cell-inner--pair">
          <div className="song-cell-main">
            <span>Autumn Crossing</span>
            <PreviewSuitePill />
            <span className="segue" aria-hidden>
              →
            </span>
            <span>Madhuvan</span>
            <PreviewRepriseShort />
          </div>
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
        </div>
      </td>
    </tr>
  )
}

function PreviewExpandedSongRow({
  song,
  showReprise = false,
}: {
  song: string
  showReprise?: boolean
}) {
  return (
    <tr className="song-row">
      <td className="song-cell">
        <div className="song-cell-inner">
          <div className="song-cell-main">
            <span>{song}</span>
            {showReprise ? <PreviewRepriseShort /> : null}
            <span className="segue" aria-hidden>
              →
            </span>
          </div>
        </div>
      </td>
    </tr>
  )
}

function PreviewAutumnCrossingExpandedRows() {
  return (
    <>
      <PreviewExpandedSongRow song="Travelers" />
      <PreviewExpandedSongRow song="Elmeg the Wise" />
      <PreviewExpandedSongRow song="Madhuvan" showReprise />
    </>
  )
}

/**
 * Static setlist excerpt (interlude pairs + Autumn Crossing suite).
 */
export function WlHomeV2SettingsSetlistPreview({
  expandedByDefault,
}: WlHomeV2SettingsSetlistPreviewProps) {
  return (
    <div
      className="wl-home-v2-settings-preview"
      aria-label={
        expandedByDefault ?
          "Preview: combined rows open as separate songs on load"
        : "Preview: combined rows stay on one line on load"
      }
    >
      <div className="wl-home-v2-setlist wl-home-v2-settings-preview__setlist">
        <table className="set-table">
          <tbody>
            {expandedByDefault ?
              <>
                <PreviewExpandedInterludeRows
                  interlude="Interlude II"
                  song="Jive I"
                />
                <PreviewExpandedInterludeRows
                  interlude="(dawn)"
                  song="SOS"
                  songFirst
                />
                <PreviewAutumnCrossingExpandedRows />
              </>
            : <>
                <PreviewCombinedInterludeRow
                  interlude="Interlude II"
                  song="Jive I"
                />
                <PreviewCombinedInterludeRow
                  interlude="dawn"
                  song="SOS"
                  songFirst
                />
                <PreviewAutumnMadhuvanCombinedRow />
              </>
            }
          </tbody>
        </table>
      </div>
      <p className="wl-home-v2-settings-preview__caption">
        {expandedByDefault ?
          "On load, song pairs, reprises, and suites open as separate songs."
        : "On load, song pairs, reprises, and suites stay on one line until you tap +."}
      </p>
    </div>
  )
}
