"use client"

import Link from "next/link"
import {
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react"

import {
  formatSetlistDate,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { songDetailPlacementLegendSwatch } from "@/lib/song-detail-placement-chip"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import type { LastPlayed, SongData, SongStats } from "@/types/song"

export function WlHomeV2SongArchiveDetailInfoStrip({
  song,
  stats,
  lastPlayed,
  selectedGroup,
  setSelectedGroup,
  selectedPlacement,
  setSelectedPlacement,
  barSegments,
  legendRows,
  infoStripCardCount,
  hasPlacements,
}: {
  song: SongData
  stats: SongStats
  lastPlayed: LastPlayed | null
  selectedGroup: string | null
  setSelectedGroup: Dispatch<SetStateAction<string | null>>
  selectedPlacement: string | null
  setSelectedPlacement: Dispatch<SetStateAction<string | null>>
  barSegments: Array<{ placement: string; count: number; pct: number; flex: number }>
  legendRows: Array<{
    placement: string
    count: number
    pct: number
    swatch: string
  }>
  infoStripCardCount: number
  hasPlacements: boolean
}) {
  return (
    <div
      className="info-strip"
      style={
        {
          "--info-strip-cards": infoStripCardCount,
        } as CSSProperties
      }
    >
      <div className="card">
        <div className="card-head">
          <h3>Song Info</h3>
        </div>
        <div className="card-body">
          {song.song_originalartist?.trim() ?
            <div className="info-row">
              <div className="lbl">Original Artist</div>
              <div className="val">{song.song_originalartist}</div>
            </div>
          : null}
          {song.song_writer?.trim() ?
            <div className="info-row">
              <div className="lbl">Writer</div>
              <div className="val">{song.song_writer}</div>
            </div>
          : null}
          {lastPlayed ?
            <div className="info-row">
              <div className="lbl">Last Time Played</div>
              <div className="val">
                <Link
                  href={getSetlistArchiveUrl(lastPlayed.show_id)}
                  className="venue-link"
                >
                  {formatSetlistDate(lastPlayed.show_date)}
                </Link>
                <span className="sub">
                  (
                  {lastPlayed.showsAgo === 1 ?
                    "most recent show"
                  : `${lastPlayed.showsAgo} shows ago`}
                  )
                </span>
              </div>
            </div>
          : null}
        </div>
      </div>

      {stats.groupCounts.length > 0 ?
        <div className="card">
          <div className="card-head">
            <h3>Stats</h3>
            <span className="hd-meta">
              {stats.totalShows} performance
              {stats.totalShows === 1 ? "" : "s"}
            </span>
          </div>
          <div className="card-body">
            {stats.hasRarity ?
              <div className="stats-rarity">
                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                  SONG RARITY
                </span>
                <span
                  className="rare-pill"
                  style={
                    {
                      "--setlist-rare-fill":
                        getRarityPillBackground(stats.rarity),
                      "--setlist-rare-border":
                        getRarityColor(stats.rarity),
                    } as CSSProperties
                  }
                >
                  {stats.rarity}
                </span>
              </div>
            : null}
            <div
              className="lbl"
              style={{
                fontFamily: '"Geist Mono", monospace',
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Performances by Group
            </div>
            <ul className="group-count-list">
              {stats.groupCounts.map(({ group, count }) => (
                <li key={group}>
                  <button
                    type="button"
                    className={`group-count-btn${selectedGroup === group ? " active" : ""}`}
                    data-group={group}
                    onClick={() => {
                      setSelectedPlacement(null)
                      setSelectedGroup((g) =>
                        g === group ? null : group,
                      )
                    }}
                  >
                    <span className="gn-name">{group}</span>
                    <span className="gn-count">{count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      : null}

      {song.song_coachnotes?.trim() ?
        <div className="card notes-card">
          <div className="card-head">
            <h3>Coach&apos;s Notes</h3>
          </div>
          <div
            className="card-body"
            dangerouslySetInnerHTML={{ __html: song.song_coachnotes }}
          />
        </div>
      : null}

      {hasPlacements ?
        <div className="card">
          <div className="card-head">
            <h3>Set Placements</h3>
          </div>
          <div className="card-body">
            <div className="placement-bar">
              {barSegments.map((s) => (
                <button
                  key={s.placement}
                  type="button"
                  className={`pb-seg${selectedPlacement === s.placement ? " active" : ""}`}
                  aria-label={`Filter performances by ${s.placement}`}
                  aria-pressed={selectedPlacement === s.placement}
                  style={{
                    flex: s.flex,
                    background: songDetailPlacementLegendSwatch(
                      s.placement,
                    ),
                  }}
                  onClick={() => {
                    setSelectedGroup(null)
                    setSelectedPlacement((cur) =>
                      cur === s.placement ? null : s.placement,
                    )
                  }}
                />
              ))}
            </div>
            <div className="placement-legend">
              {legendRows.map((row) => (
                <button
                  key={row.placement}
                  type="button"
                  className={`pl-row placement-legend-btn${selectedPlacement === row.placement ? " active" : ""}`}
                  aria-label={`Filter performances by ${row.placement}`}
                  aria-pressed={selectedPlacement === row.placement}
                  onClick={() => {
                    setSelectedGroup(null)
                    setSelectedPlacement((cur) =>
                      cur === row.placement ? null : row.placement,
                    )
                  }}
                >
                  <span
                    className="sw"
                    style={{ background: row.swatch }}
                  />
                  <span className="nm">{row.placement}</span>
                  <span className="ct">{row.count}</span>
                  <span className="pct">{Math.round(row.pct)}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      : null}
    </div>
  )
}
