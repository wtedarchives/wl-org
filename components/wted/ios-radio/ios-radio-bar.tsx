"use client"

import Image from "next/image"
import { useState } from "react"
import {
  Broadcast,
  CircleNotch,
  PlayCircle,
  StopCircle,
} from "@phosphor-icons/react"

import { ArchivePrefetchLink } from "@/components/archive/archive-prefetch-link"
import { IosRadioBarSubtext } from "@/components/wted/ios-radio/ios-radio-bar-subtext"
import { IosRadioBarVisualizer } from "@/components/wted/ios-radio/ios-radio-bar-visualizer"
import { IosRadioBarVolume } from "@/components/wted/ios-radio/ios-radio-bar-volume"
import { IosRadioMarquee } from "@/components/wted/ios-radio/ios-radio-bar-marquee"
import { useIosRadioPlayerContext } from "@/components/wted/ios-radio/ios-radio-player-context"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { formatRadioTrackClock } from "@/lib/wted-radio-track-display-title"

import "./ios-radio.css"

function IosRadioBarCopyInner({
  player,
}: {
  player: ReturnType<typeof useIosRadioPlayerContext>
}) {
  const liveFallback = !player.isBuffering && !player.displayArtist
  const primary =
    player.isBuffering ? "Buffering…"
    : player.displayArtist ? player.displayArtist
    : player.isOnline ? `LIVE • ${player.stationName}`
    : "Offline"
  const episode =
    player.isBuffering ? null : player.episodeSubtext

  return (
    <>
      <IosRadioMarquee text={player.displayTitle} variant="title" />
      <IosRadioBarSubtext
        primary={primary}
        episode={episode}
        live={liveFallback}
        online={player.isOnline}
      />
    </>
  )
}

export function IosRadioBar() {
  const player = useIosRadioPlayerContext()
  const [volumeOpen, setVolumeOpen] = useState(false)
  const setlistHref =
    player.setlistShowId ?
      getSetlistArchiveUrl(player.setlistShowId)
    : null

  return (
    <div
      className={
        volumeOpen ? "ios-radio-bar is-volume-open" : "ios-radio-bar"
      }
    >
      <IosRadioBarVisualizer
        analyser={player.analyser}
        active={player.isPlaying && !player.isBuffering}
      />
      <div className="ios-radio-bar__visualizer-veil" aria-hidden />
      <div className="ios-radio-bar__art">
        {player.artworkUrl ?
          <Image
            src={player.artworkUrl}
            alt=""
            width={40}
            height={40}
            className="ios-radio-bar__art-img"
            unoptimized
          />
        : <span className="ios-radio-bar__art-fallback">
            <Broadcast size={28} weight="fill" aria-hidden />
          </span>
        }
      </div>

      {setlistHref ?
        <ArchivePrefetchLink
          href={setlistHref}
          prefetch={false}
          className="ios-radio-bar__copy ios-radio-bar__copy--link"
          aria-label={`Open setlist for ${player.displayTitle}`}
        >
          <IosRadioBarCopyInner player={player} />
        </ArchivePrefetchLink>
      : <div className="ios-radio-bar__copy">
          <IosRadioBarCopyInner player={player} />
        </div>
      }

      <div className="ios-radio-bar__controls">
        {player.remaining != null ?
          <div className="ios-radio-bar__countdown">
            {formatRadioTrackClock(player.remaining)}
          </div>
        : null}

        <IosRadioBarVolume open={volumeOpen} onOpenChange={setVolumeOpen} />

        <button
          type="button"
          className="ios-radio-bar__play"
          onClick={player.toggle}
          disabled={player.isBuffering}
          aria-busy={player.isBuffering}
          aria-label={
            player.isBuffering ? "Buffering radio"
            : player.isPlaying ? "Stop radio"
            : "Play radio"
          }
        >
          {player.isPlaying && !player.isBuffering ?
            <>
              <span className="ios-radio-bar__pulse" aria-hidden />
              <span
                className="ios-radio-bar__pulse ios-radio-bar__pulse--delay"
                aria-hidden
              />
            </>
          : null}
          {player.isBuffering ?
            <CircleNotch
              className="ios-radio-bar__play-icon animate-spin"
              size={34}
              weight="bold"
              aria-hidden
            />
          : player.isPlaying ?
            <StopCircle
              className="ios-radio-bar__play-icon"
              size={34}
              weight="fill"
              aria-hidden
            />
          : <PlayCircle
              className="ios-radio-bar__play-icon"
              size={34}
              weight="fill"
              aria-hidden
            />
          }
        </button>
      </div>
    </div>
  )
}
