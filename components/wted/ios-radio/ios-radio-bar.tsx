"use client"

import Image from "next/image"
import { useState } from "react"
import {
  Broadcast,
  CircleNotch,
  PlayCircle,
  StopCircle,
} from "@phosphor-icons/react"

import { IosRadioBarVolume } from "@/components/wted/ios-radio/ios-radio-bar-volume"
import { IosRadioMarquee } from "@/components/wted/ios-radio/ios-radio-bar-marquee"
import { useIosRadioPlayerContext } from "@/components/wted/ios-radio/ios-radio-player-context"
import { formatRadioTrackClock } from "@/lib/wted-radio-track-display-title"

import "./ios-radio.css"

export function IosRadioBar() {
  const player = useIosRadioPlayerContext()
  const [volumeOpen, setVolumeOpen] = useState(false)

  return (
    <div
      className={
        volumeOpen ? "ios-radio-bar is-volume-open" : "ios-radio-bar"
      }
    >
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

      <div className="ios-radio-bar__copy">
        <IosRadioMarquee text={player.displayTitle} variant="title" />
        {player.isBuffering ?
          <IosRadioMarquee text="Buffering…" variant="sub" />
        : player.displayArtist ?
          <IosRadioMarquee text={player.displayArtist} variant="sub" />
        : <div className="ios-radio-bar__live">
            <span
              className={
                player.isOnline ?
                  "ios-radio-bar__live-dot"
                : "ios-radio-bar__live-dot ios-radio-bar__live-dot--off"
              }
            />
            <IosRadioMarquee
              text={
                player.isOnline ?
                  `LIVE • ${player.stationName}`
                : "Offline"
              }
              variant="sub"
            />
          </div>
        }
      </div>

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
