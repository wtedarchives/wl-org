"use client"

import { formatLyricsHtml } from "@/components/archive-song/song-archive-detail-view.lib"
import type { SongData } from "@/types/song"

export function WlHomeV2SongArchiveDetailLyricsColumn({ song }: { song: SongData }) {
  return (
    <div className="col-side">
      <div className="card lyrics-card">
        <div className="card-head">
          <h3>Lyrics</h3>
        </div>
        <div className="card-body">
          <div
            className="lyrics-card__html"
            dangerouslySetInnerHTML={{
              __html: formatLyricsHtml(song.song_lyrics ?? ""),
            }}
          />
        </div>
      </div>
    </div>
  )
}
