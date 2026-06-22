"use client"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  altNameHasParentheticalSegments,
  altNameSegmentPillVariant,
  parseAltNameSegments,
} from "@/lib/song-pairs"

type WlHomeV2SetlistAltNameDisplayProps = {
  altName: string
  onClick?: () => void
}

function AltNameSegments({ altName }: { altName: string }) {
  const segments = parseAltNameSegments(altName)

  return (
    <span className="setlist-alt-name-segments">
      {segments.map((segment, index) =>
        segment.type === "text" ?
          <span key={`text-${index}`} className="setlist-alt-name-text">
            {segment.value}
          </span>
        : <span
            key={`paren-${index}`}
            className="setlist-alt-name-pill"
            data-alt-name-pill={altNameSegmentPillVariant(segment.value)}
          >
            {segment.value}
          </span>,
      )}
    </span>
  )
}

export function WlHomeV2SetlistAltNameDisplay({
  altName,
  onClick,
}: WlHomeV2SetlistAltNameDisplayProps) {
  const inner =
    altNameHasParentheticalSegments(altName) ?
      <AltNameSegments altName={altName} />
    : <SongDisplayName song={altName} />

  if (onClick) {
    return (
      <button
        type="button"
        className="song-cell-song-hit song-cell-song-hit--alt-name"
        onClick={onClick}
      >
        {inner}
      </button>
    )
  }

  return inner
}
