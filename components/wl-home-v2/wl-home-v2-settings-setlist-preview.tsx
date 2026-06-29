"use client"

import { Plus } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import { SETLIST_EXPAND_BUTTON_CLASS } from "@/components/dpro/setlist/setlist-expand-button"
import { WlHomeV2SetlistSongTreeChrome } from "@/components/wl-home-v2/wl-home-v2-setlist-song-tree-chrome"
import type { SetlistTreeChrome } from "@/lib/song-pairs"
import { cn } from "@/lib/utils"

import "./wl-home-v2-settings.css"
import "./wl-home-v2-setlist-tree.css"

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
  showSegue = true,
}: {
  interlude: string
  song: string
  /** When true, song name precedes the pill (e.g. SOS + dawn). */
  songFirst?: boolean
  showSegue?: boolean
}) {
  const pill = <PreviewInterludeShort label={interlude} />
  const songName = <span>{song}</span>
  return (
    <tr className="song-row song-row--pair">
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
            {showSegue ?
              <span className="segue" aria-hidden>
                →
              </span>
            : null}
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
  showSegueOnFirst = true,
  showSegueOnSecond = true,
}: {
  interlude: string
  song: string
  songFirst?: boolean
  showSegueOnFirst?: boolean
  showSegueOnSecond?: boolean
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
              {showSegueOnFirst ?
                <span className="segue" aria-hidden>
                  →
                </span>
              : null}
            </div>
          </div>
        </td>
      </tr>
      <tr className="song-row">
        <td className="song-cell">
          <div className="song-cell-inner">
            <div className="song-cell-main">
              <span>{secondLabel}</span>
              {showSegueOnSecond ?
                <span className="segue" aria-hidden>
                  →
                </span>
              : null}
            </div>
          </div>
        </td>
      </tr>
    </>
  )
}

function PreviewSuitePill({ label }: { label: string }) {
  return (
    <span className="setlist-alt-name-pill" data-alt-name-pill="suite">
      {label}
    </span>
  )
}

function PreviewRepriseShort() {
  return <span className="short">reprise</span>
}

function PreviewTreeSongCell({
  treeChrome,
  children,
}: {
  treeChrome?: SetlistTreeChrome
  children: ReactNode
}) {
  return (
    <WlHomeV2SetlistSongTreeChrome treeChrome={treeChrome}>
      {children}
    </WlHomeV2SetlistSongTreeChrome>
  )
}

function PreviewAutumnMadhuvanCondensedRows() {
  const firstChildChrome: SetlistTreeChrome = {
    role: "child",
    siblingIndex: 0,
    siblingCount: 2,
    isLastSibling: false,
  }
  const lastChildChrome: SetlistTreeChrome = {
    role: "child",
    siblingIndex: 1,
    siblingCount: 2,
    isLastSibling: true,
  }

  return (
    <>
      <tr className="song-row song-row--pair song-row--tree-parent">
        <td className="song-cell">
          <div className="song-cell-inner song-cell-inner--pair">
            <div className="song-cell-main">
              <PreviewSuitePill label="Jive Suite" />
              <span className="segue" aria-hidden>
                →
              </span>
              <span>Madhuvan</span>
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
      <tr className="song-row song-row--tree-child song-row--tree-child-first">
        <td className="song-cell">
          <PreviewTreeSongCell treeChrome={firstChildChrome}>
            <div className="song-cell-main">
              <span>Trevor Reads Poetry</span>
            </div>
          </PreviewTreeSongCell>
        </td>
      </tr>
      <tr className="song-row song-row--tree-child song-row--tree-child-last">
        <td className="song-cell">
          <PreviewTreeSongCell treeChrome={lastChildChrome}>
            <div className="song-cell-main">
              <span>Madhuvan</span>
              <PreviewRepriseShort />
            </div>
          </PreviewTreeSongCell>
        </td>
      </tr>
    </>
  )
}

function PreviewExpandedSongRow({
  song,
  showReprise = false,
  showSegue = true,
}: {
  song: string
  showReprise?: boolean
  showSegue?: boolean
}) {
  return (
    <tr className="song-row">
      <td className="song-cell">
        <div className="song-cell-inner">
          <div className="song-cell-main">
            <span>{song}</span>
            {showReprise ? <PreviewRepriseShort /> : null}
            {showSegue ?
              <span className="segue" aria-hidden>
                →
              </span>
            : null}
          </div>
        </div>
      </td>
    </tr>
  )
}

function PreviewJiveSuiteExpandedRows() {
  return (
    <>
      <PreviewExpandedSongRow song="Jive I" />
      <PreviewExpandedSongRow song="Jive II" />
      <PreviewExpandedSongRow song="Jive Lee" />
      <PreviewExpandedSongRow song="Madhuvan" showReprise showSegue={false} />
    </>
  )
}

/**
 * Static setlist excerpt (interlude pairs + Jive suite).
 */
export function WlHomeV2SettingsSetlistPreview({
  expandedByDefault,
}: WlHomeV2SettingsSetlistPreviewProps) {
  return (
    <div
      className="wl-home-v2-settings-preview"
      aria-label={
        expandedByDefault ?
          "Preview: song pairs, reprises, and suites open as separate songs on load"
        : "Preview: song pairs stay condensed; reprises and suites show as connected rows"
      }
    >
      <div className="wl-home-v2-setlist wl-home-v2-settings-preview__setlist">
        <table className="set-table">
          <tbody>
            {expandedByDefault ?
              <>
                <PreviewExpandedInterludeRows
                  interlude="(begin)"
                  song="Big Modern!"
                  showSegueOnSecond={false}
                />
                <PreviewExpandedInterludeRows
                  interlude="(dawn)"
                  song="SOS"
                  songFirst
                  showSegueOnSecond={false}
                />
                <PreviewJiveSuiteExpandedRows />
              </>
            : <>
                <PreviewCombinedInterludeRow
                  interlude="begin"
                  song="Big Modern!"
                  showSegue={false}
                />
                <PreviewCombinedInterludeRow
                  interlude="dawn"
                  song="SOS"
                  songFirst
                  showSegue={false}
                />
                <PreviewAutumnMadhuvanCondensedRows />
              </>
            }
          </tbody>
        </table>
      </div>
      <p className="wl-home-v2-settings-preview__caption">
        {expandedByDefault ?
          "On load, song pairs, reprises, and suites open as separate songs."
        : "On load, song pairs stay condensed; reprises branch beneath their parent song."}
      </p>
    </div>
  )
}
