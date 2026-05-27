"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"

import {
  pickWlHomeTickerPhraseQuad,
  WL_HOME_V2_TICKER_RANDOM_PHRASES,
} from "@/components/wl-home-v2/wl-home-v2-constants"
import { useWtedRadioNowPlaying } from "@/hooks/use-wted-radio-now-playing"

const WELCOME_TICKER_COPY =
  "Welcome to Wysteria Lane, built by Goose fans, for Goose fans."

const NOW_PLAYING_TICKER_PREFIX = "Now playing on WTED Goose Radio:  "

function initialTickerPhraseQuadSeed(): readonly [string, string, string, string] {
  const w = WL_HOME_V2_TICKER_RANDOM_PHRASES
  const n = w.length
  if (n === 0) return ["", "", "", ""]
  return [
    w[0],
    w[Math.min(1, n - 1)],
    w[Math.min(2, n - 1)],
    w[Math.min(3, n - 1)],
  ]
}

function useWlHomeV2HomeTicker() {
  const { title: nowPlayingTitle, loading: nowPlayingLoading } =
    useWtedRadioNowPlaying()

  const [tickerPhraseQuad, setTickerPhraseQuad] =
    useState<readonly [string, string, string, string]>(() =>
      initialTickerPhraseQuadSeed(),
    )
  const tickerTrackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const refreshQuadFromPreviousEnd = () => {
      setTickerPhraseQuad((prev) =>
        pickWlHomeTickerPhraseQuad(prev[prev.length - 1]),
      )
    }

    setTickerPhraseQuad(pickWlHomeTickerPhraseQuad(null))

    const node = tickerTrackRef.current
    if (node == null) return

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) {
      const id = window.setInterval(refreshQuadFromPreviousEnd, 45_000)
      return () => window.clearInterval(id)
    }

    function onTickerTrackAnimationIteration(e: Event) {
      if (!(e instanceof AnimationEvent) || e.target !== node) return
      refreshQuadFromPreviousEnd()
    }

    node.addEventListener("animationiteration", onTickerTrackAnimationIteration)
    return () =>
      node.removeEventListener(
        "animationiteration",
        onTickerTrackAnimationIteration,
      )
  }, [])

  const nowPlayingLine = useMemo(() => {
    if (nowPlayingLoading && !nowPlayingTitle) {
      return `${NOW_PLAYING_TICKER_PREFIX}…`
    }
    if (nowPlayingTitle) {
      return `${NOW_PLAYING_TICKER_PREFIX}${nowPlayingTitle}`
    }
    return null
  }, [nowPlayingTitle, nowPlayingLoading])

  const tickerPhrasesAria = tickerPhraseQuad.join(" · ")
  const tickerAriaLabel =
    nowPlayingLine != null ?
      `${WELCOME_TICKER_COPY} ${tickerPhrasesAria} ${nowPlayingLine}`
    : `${WELCOME_TICKER_COPY} ${tickerPhrasesAria}`

  return {
    tickerTrackRef,
    tickerPhraseQuad,
    nowPlayingLine,
    tickerButtonAriaLabel: `${tickerAriaLabel} Opens full WTED schedule.`,
  }
}

export function WlHomeV2HomeTicker({ onOpenSchedule }: { onOpenSchedule: () => void }) {
  const {
    tickerTrackRef,
    tickerPhraseQuad,
    nowPlayingLine,
    tickerButtonAriaLabel,
  } = useWlHomeV2HomeTicker()

  const onTickerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onOpenSchedule()
    }
  }

  return (
    <div
      className="wl-home-v2-ticker"
      role="button"
      tabIndex={0}
      aria-label={tickerButtonAriaLabel}
      onClick={onOpenSchedule}
      onKeyDown={onTickerKeyDown}
    >
      <div className="wl-home-v2-ticker-viewport">
        <div ref={tickerTrackRef} className="wl-home-v2-ticker-track">
          {[0, 1].flatMap((duplicateHalf) =>
            tickerPhraseQuad.map((phrase, qi) => (
              <span
                key={`${duplicateHalf}-${qi}`}
                className="wl-home-v2-ticker-unit"
                aria-hidden="true"
              >
                <span className="wl-home-v2-ticker-segment">
                  {WELCOME_TICKER_COPY}
                </span>
                <span className="wl-home-v2-ticker-segment wl-home-v2-ticker-segment--random-phrase">
                  {phrase}
                </span>
                {nowPlayingLine != null ?
                  <span className="wl-home-v2-ticker-segment wl-home-v2-ticker-segment--now-playing">
                    <span className="live-dot" aria-hidden />
                    {nowPlayingLine}
                  </span>
                : null}
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
