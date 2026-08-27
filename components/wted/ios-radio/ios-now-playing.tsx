"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import {
  CircleNotch,
  MoonStars,
  PlayCircle,
  ShareNetwork,
  StopCircle,
} from "@phosphor-icons/react"

import { IosNowPlayingHistory } from "@/components/wted/ios-radio/ios-now-playing-history"
import { useIosRadioPlayerContext } from "@/components/wted/ios-radio/ios-radio-player-context"
import { WTED_RADIO_FALLBACK_ARTWORK } from "@/lib/wted-radio-co-status"
import { formatRadioTrackClock } from "@/lib/wted-radio-track-display-title"

import "./ios-radio.css"

function sleepOptionLabel(minutes: number) {
  return minutes >= 60 ? "1 hr" : `${minutes}m`
}

function sleepRemainingLabel(endMs: number, nowMs: number) {
  const secs = Math.max(0, Math.round((endMs - nowMs) / 1000))
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
}

function IosNowPlayingArtwork({
  url,
  buffering,
  playing,
  onToggle,
}: {
  url: string | null
  buffering: boolean
  playing: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="ios-now-playing__art"
      onClick={onToggle}
      disabled={buffering}
      aria-busy={buffering}
      aria-label={
        buffering ? "Buffering radio"
        : playing ? "Stop radio"
        : "Play radio"
      }
    >
      {url ?
        <Image
          src={url}
          alt=""
          width={320}
          height={320}
          className="ios-now-playing__art-img"
          unoptimized
        />
      : <span className="ios-now-playing__art-fallback">
          <Image
            src={WTED_RADIO_FALLBACK_ARTWORK}
            alt=""
            width={320}
            height={320}
            className="ios-now-playing__art-fallback-img"
            unoptimized
          />
        </span>
      }
    </button>
  )
}

export function IosNowPlaying() {
  const player = useIosRadioPlayerContext()
  const [sleepOpen, setSleepOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!player.sleepTimerEnd) return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [player.sleepTimerEnd])

  const share = useCallback(async () => {
    const name = player.displayTitle
    const text = `I'm listening to ${name} on WTED Goose Radio. Find out more at WTEDRadio.com.`
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text })
        return
      }
    } catch {
      // Fall through to clipboard if the share sheet is dismissed or missing.
    }
    try {
      await navigator.clipboard.writeText(text)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1600)
    } catch {
      setShareCopied(false)
    }
  }, [player.displayTitle])

  const sleepLabel =
    player.sleepTimerEnd ?
      sleepRemainingLabel(player.sleepTimerEnd, nowMs)
    : "Sleep"

  return (
    <div className="ios-now-playing">
      <div className="ios-now-playing__stack">
        <IosNowPlayingArtwork
          url={player.artworkUrl}
          buffering={player.isBuffering}
          playing={player.isPlaying}
          onToggle={player.toggle}
        />

        <div className="ios-now-playing__track">
          <div className="ios-now-playing__live">
            <span
              className={
                player.isOnline ?
                  "ios-now-playing__live-dot"
                : "ios-now-playing__live-dot ios-now-playing__live-dot--off"
              }
            />
            {player.isOnline ? "LIVE" : "OFFLINE"}
          </div>
          <h1 className="ios-now-playing__title">{player.displayTitle}</h1>
          {player.displayArtist ?
            <p className="ios-now-playing__artist">{player.displayArtist}</p>
          : null}
        </div>

        {player.elapsed != null && player.totalDuration != null ?
          <div className="ios-now-playing__clock">
            <span className="ios-now-playing__clock-elapsed">
              {formatRadioTrackClock(player.elapsed)}
            </span>
            <span className="ios-now-playing__clock-sep">/</span>
            <span className="ios-now-playing__clock-total">
              {formatRadioTrackClock(player.totalDuration)}
            </span>
          </div>
        : null}

        <button
          type="button"
          className="ios-now-playing__play"
          onClick={player.toggle}
          disabled={player.isBuffering}
          aria-busy={player.isBuffering}
          aria-label={
            player.isBuffering ? "Buffering radio"
            : player.isPlaying ? "Stop radio"
            : "Play radio"
          }
        >
          {player.isBuffering ?
            <CircleNotch
              className="animate-spin"
              size={56}
              weight="bold"
              aria-hidden
            />
          : player.isPlaying ?
            <StopCircle size={72} weight="fill" aria-hidden />
          : <PlayCircle size={72} weight="fill" aria-hidden />
          }
        </button>

        <div className="ios-now-playing__sleep">
          <div className="ios-now-playing__controls">
            <button
              type="button"
              className={
                player.sleepTimerEnd || sleepOpen ?
                  "ios-now-playing__control ios-now-playing__control--active"
                : "ios-now-playing__control"
              }
              aria-expanded={sleepOpen}
              onClick={() => setSleepOpen((open) => !open)}
            >
              <span className="ios-now-playing__control-icon">
                <MoonStars size={20} weight="fill" aria-hidden />
              </span>
              <span className="ios-now-playing__control-label">
                {sleepLabel}
              </span>
            </button>
            <button
              type="button"
              className="ios-now-playing__control"
              onClick={() => void share()}
            >
              <span className="ios-now-playing__control-icon">
                <ShareNetwork size={20} weight="fill" aria-hidden />
              </span>
              <span className="ios-now-playing__control-label">
                {shareCopied ? "Copied" : "Share"}
              </span>
            </button>
          </div>

          <div
            className={
              sleepOpen ?
                "ios-now-playing__sleep-options is-open"
              : "ios-now-playing__sleep-options"
            }
          >
            {player.sleepOptionsMinutes.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className="ios-now-playing__sleep-chip"
                onClick={() => {
                  player.startSleepTimer(minutes)
                  setSleepOpen(false)
                }}
              >
                {sleepOptionLabel(minutes)}
              </button>
            ))}
            {player.sleepTimerEnd ?
              <button
                type="button"
                className="ios-now-playing__sleep-chip ios-now-playing__sleep-cancel"
                onClick={() => {
                  player.cancelSleepTimer()
                  setSleepOpen(false)
                }}
              >
                Cancel
              </button>
            : null}
          </div>
        </div>

        <IosNowPlayingHistory />
      </div>
    </div>
  )
}
