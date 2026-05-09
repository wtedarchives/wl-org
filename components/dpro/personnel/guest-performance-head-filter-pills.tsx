"use client"

import type { KeyboardEvent } from "react"

export function PersonnelPerfHeadFilterPills({
  selectedGroup,
  selectedSong,
  onClearSelectedGroup,
  onClearSelectedSong,
}: {
  selectedGroup: string | null
  selectedSong: string | null
  onClearSelectedGroup?: () => void
  onClearSelectedSong?: () => void
}) {
  const onKeyClear =
    (fn?: () => void) => (e: KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        fn?.()
      }
    }

  return (
    <>
      {selectedGroup ?
        <span className="pill-filter">
          <span>{selectedGroup}</span>
          <span
            className="x"
            role="button"
            tabIndex={0}
            onClick={() => onClearSelectedGroup?.()}
            onKeyDown={onKeyClear(onClearSelectedGroup)}
          >
            ×
          </span>
        </span>
      : null}
      {selectedSong ?
        <span className="pill-filter">
          <span>{selectedSong}</span>
          <span
            className="x"
            role="button"
            tabIndex={0}
            onClick={() => onClearSelectedSong?.()}
            onKeyDown={onKeyClear(onClearSelectedSong)}
          >
            ×
          </span>
        </span>
      : null}
    </>
  )
}
