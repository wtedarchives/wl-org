import {
  getJotyPillWlV2Style,
  getLastCountPillStyle,
  JOTY_EXPLANATIONS,
  SHORT_EXPLANATIONS,
} from "@/components/dpro/setlist/display-setlist-table.constants"

/** Last column header: same pill shapes as `last-pill` + copy (portaled tooltip). */
export function WlHomeV2LastHeaderTooltipBody() {
  const rows = [
    {
      sample: "Debut",
      rest: "First known time the song was played by Goose.",
    },
    {
      sample: "TD",
      rest: "First time played in the current tour.",
    },
    {
      sample: "LIB",
      rest: "First time in more than a calendar year.",
    },
  ] as const
  return (
    <div className="setlist-header-last-tooltip">
      {rows.map(({ sample, rest }) => {
        const pill = getLastCountPillStyle(sample)
        if (!pill) return null
        return (
          <div key={sample} className="setlist-header-last-tooltip-row">
            <span
              className="setlist-legend-last-pill"
              style={{
                background: pill.background,
                color: pill.color,
                border: `1px solid ${pill.borderColor}`,
              }}
            >
              {sample}
            </span>
            <span className="setlist-header-last-tooltip-rest">{rest}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Song column header explainer (segue, [short] keys, JOTY round legend) — WL v2 treatment. */
export function WlHomeV2SetlistSongHeaderTooltipBody({
  hasSegue,
  sortedShorts,
  jotyRoundsInOrder,
  shortLabelByKey,
}: {
  hasSegue: boolean
  sortedShorts: string[]
  jotyRoundsInOrder: string[]
  shortLabelByKey: Map<string, string>
}) {
  return (
    <div className="setlist-header-song-tooltip">
      {hasSegue ?
        <div className="setlist-header-song-tooltip-row setlist-header-song-tooltip-row--segue">
          <span className="setlist-header-song-tooltip-arrow" aria-hidden>
            →
          </span>
          <span className="setlist-header-song-tooltip-segue-text">
            Song segues into the next song without stopping.
          </span>
        </div>
      : null}
      {sortedShorts.map((short) => (
        <div key={short} className="setlist-header-song-tooltip-row setlist-header-song-tooltip-row--short">
          <span className="setlist-legend-short-pill">
            {shortLabelByKey.get(short) ?? short}
          </span>
          <span className="setlist-header-song-tooltip-desc">
            {SHORT_EXPLANATIONS[short]}
          </span>
        </div>
      ))}
      {jotyRoundsInOrder.map((round) => {
        const pill = getJotyPillWlV2Style(round)
        return (
          <div key={round} className="setlist-header-song-tooltip-row setlist-header-song-tooltip-row--joty">
            <span
              className="setlist-header-song-tooltip-joty-pill"
              style={{
                background: pill.background,
                color: pill.color,
                border: `1px solid ${pill.borderColor}`,
              }}
            >
              {round}
            </span>
            <span className="setlist-header-song-tooltip-desc">
              {JOTY_EXPLANATIONS[round] ?? round}
            </span>
          </div>
        )
      })}
    </div>
  )
}
