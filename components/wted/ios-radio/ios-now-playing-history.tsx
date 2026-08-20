"use client"

import Image from "next/image"
import { Fragment } from "react"
import { CircleNotch } from "@phosphor-icons/react"

import { useWtedRecentlyPlayedTracks } from "@/hooks/use-wted-recently-played-tracks"
import type { WtedRecentlyPlayedTrack } from "@/lib/wted-recently-played"

const FALLBACK_ART = "/WL.png"

function HistoryThumb({ track }: { track: WtedRecentlyPlayedTrack }) {
  if (track.artworkUrl) {
    return (
      <div className="ios-now-playing__history-thumb">
        <Image
          src={track.artworkUrl}
          alt=""
          width={40}
          height={40}
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className="ios-now-playing__history-thumb">
      <span className="ios-now-playing__history-thumb-fallback">
        <Image src={FALLBACK_ART} alt="" width={24} height={24} unoptimized />
      </span>
    </div>
  )
}

export function IosNowPlayingHistory() {
  const { tracks, loading, error } = useWtedRecentlyPlayedTracks(true)

  return (
    <section className="ios-now-playing__history" aria-label="Recently played">
      <h2 className="ios-now-playing__history-title">Recently Played</h2>
      {loading && tracks.length === 0 ?
        <p className="ios-now-playing__history-status">
          <CircleNotch className="size-4 animate-spin" aria-hidden />
          Loading recently played…
        </p>
      : error ?
        <p className="ios-now-playing__history-status">{error}</p>
      : tracks.length === 0 ?
        <p className="ios-now-playing__history-status">No history yet.</p>
      : <ul className="ios-now-playing__history-list">
          {tracks.map((track) => (
            <Fragment key={track.id}>
              {track.startsEpisode && track.episodeName ?
                <li className="ios-now-playing__history-divider">
                  {track.episodeName}
                </li>
              : null}
              <li className="ios-now-playing__history-row">
                <HistoryThumb track={track} />
                <span className="ios-now-playing__history-track">
                  {track.title}
                </span>
              </li>
            </Fragment>
          ))}
        </ul>
      }
    </section>
  )
}
