"use client"

import type { CSSProperties } from "react"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import Link from "next/link"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getMatrixPlacementColor } from "@/lib/stats/tour-utils"
import type { UserSongMatrixData, YearGroup } from "@/hooks/use-user-song-matrix"

function formatShowDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${m}.${day}`
}

export interface UserSongMatrixProps {
  songMatrix: UserSongMatrixData
  sortedSongs: string[]
  yearGroups: YearGroup[]
  yearIdMap: Record<string, string>
  songIdMap: Record<string, string>
  shows: Array<{ show_id: string; show_date: string }>
  onSongClick?: (
    songName: string,
    songDisplayName?: string | null,
    songId?: string
  ) => void
}

export function UserSongMatrix({
  songMatrix,
  sortedSongs,
  yearGroups,
  yearIdMap,
  songIdMap,
  shows,
  onSongClick,
}: UserSongMatrixProps) {
  return (
    <div className="wl-profile-songs-matrix-scroll">
      <table className="wl-profile-songs-matrix__table">
        <thead>
          <tr className="wl-profile-songs-matrix__thead-row">
            <th
              scope="colgroup"
              rowSpan={2}
              className="wl-profile-songs-matrix__th wl-profile-songs-matrix__th--song"
            >
              Song
            </th>
            {yearGroups.map((group) => (
              <th
                key={group.year}
                scope="colgroup"
                colSpan={group.shows.length}
                className="wl-profile-songs-matrix__th"
              >
                {yearIdMap[group.year] ?
                  <Link href={getYearArchiveUrl(yearIdMap[group.year])}>
                    {group.year}
                  </Link>
                : <span>{group.year}</span>}
              </th>
            ))}
          </tr>
          <tr className="wl-profile-songs-matrix__thead-row">
            {shows.map((show) => (
              <th
                key={show.show_id}
                scope="col"
                className="wl-profile-songs-matrix__th wl-profile-songs-matrix__th--show"
              >
                <Link href={getSetlistArchiveUrl(show.show_id)}>
                  {formatShowDate(show.show_date)}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="wl-profile-songs-matrix__tbody">
          {sortedSongs.map((song) => {
            const performances = songMatrix.data[song] ?? []
            const heardAtAnyAttendedShow = performances.length > 0
            return (
              <tr
                key={song}
                className={
                  heardAtAnyAttendedShow ?
                    undefined
                  : "wl-profile-songs-matrix__tr--unseen"
                }
              >
                <td className="wl-profile-songs-matrix__td-song">
                  {onSongClick ?
                    <button
                      type="button"
                      onClick={() =>
                        onSongClick(
                          song,
                          songMatrix.songDisplayNameMap?.[song],
                          songIdMap[song],
                        )
                      }
                      className="wl-profile-songs-matrix__song-btn"
                    >
                      <SongDisplayName
                        song={song}
                        songDisplayName={songMatrix.songDisplayNameMap?.[song]}
                      />
                    </button>
                  : songIdMap[song] ?
                    <Link href={getSongArchiveUrl(songIdMap[song])}>
                      <SongDisplayName
                        song={song}
                        songDisplayName={songMatrix.songDisplayNameMap?.[song]}
                      />
                    </Link>
                  : <SongDisplayName
                      song={song}
                      songDisplayName={songMatrix.songDisplayNameMap?.[song]}
                    />
                  }
                </td>
                {shows.map((show) => {
                  const perf = performances.find(
                    (p) => p.showId === show.show_id,
                  )
                  const base = getMatrixPlacementColor(perf?.placement ?? null)
                  const bg =
                    perf?.placement?.startsWith("Main Set") ? "#333333" : base
                  return (
                    <td
                      key={`${song}-${show.show_id}`}
                      className="wl-profile-songs-matrix__td-cell"
                      style={
                        {
                          "--wl-matrix-cell-bg": bg || "transparent",
                        } as CSSProperties
                      }
                    >
                      {perf ?
                        <span className="wl-profile-songs-matrix__td-inner">
                          {perf.venueAppearanceCount}
                        </span>
                      : null}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
