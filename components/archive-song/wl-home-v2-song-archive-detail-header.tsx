"use client"

import Image from "next/image"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { SongData } from "@/types/song"

import { categoryInitials } from "@/components/archive-song/song-archive-detail-view.lib"

export function WlHomeV2SongArchiveDetailHeader({
  song,
  subtitleParts,
}: {
  song: SongData
  subtitleParts: string[]
}) {
  return (
    <div className="song-header">
      <div className="left">
        <div
          className="artwork-float"
          style={{
            width: 52,
            height: 52,
            margin: 0,
            float: "none",
            flexShrink: 0,
          }}
          title={`${song.song_category} artwork`}
        >
          {song.categories?.category_artwork ?
            <Image
              src={song.categories.category_artwork}
              alt=""
              width={52}
              height={52}
              className="size-full object-cover"
              unoptimized
            />
          : categoryInitials(song.song_category)}
        </div>
        <div>
          <h1>
            <SongDisplayName
              song={song.song}
              songDisplayName={song.song_displayname}
              underlineOnHover={false}
            />
            {subtitleParts.length > 0 ?
              <span className="alt-name">{subtitleParts.join(" · ")}</span>
            : null}
          </h1>
        </div>
      </div>
    </div>
  )
}
