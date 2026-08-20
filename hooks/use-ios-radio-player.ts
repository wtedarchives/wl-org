"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { attachArtworkToRecentlyPlayedTracks } from "@/lib/wted-recently-played"
import {
  WTED_RADIO_NAME,
  WTED_RADIO_STATUS_POLL_MS,
  WTED_RADIO_STATUS_URL,
  WTED_RADIO_STREAM_URL,
  WTED_RADIO_V2_CURRENT_TRACK_URL,
  type RadioCoStatusResponse,
  type RadioCoV2CurrentTrackResponse,
} from "@/lib/wted-radio-co-status"
import { parseRadioNowPlayingTitle } from "@/lib/wted-radio-track-display-title"

const MAX_ARTWORK_ATTEMPTS = 3
const SLEEP_OPTIONS_MINUTES = [5, 10, 15, 20, 25, 30, 45, 60] as const

export type IosRadioPlayerState = {
  isPlaying: boolean
  isBuffering: boolean
  isOnline: boolean
  stationName: string
  rawTitle: string | null
  displayTitle: string
  displayArtist: string | null
  artworkUrl: string | null
  totalDuration: number | null
  elapsed: number | null
  remaining: number | null
  volume: number
  sleepTimerEnd: number | null
  sleepOptionsMinutes: readonly number[]
  play: () => void
  stop: () => void
  toggle: () => void
  setVolume: (value: number) => void
  startSleepTimer: (minutes: number) => void
  cancelSleepTimer: () => void
}

function clampElapsed(raw: number, total: number | null) {
  if (total == null) return raw
  return Math.min(Math.max(raw, 0), total)
}

const RADIO_POLL_FLOOR_MS = 5_000
const RADIO_POLL_CEILING_MS = 300_000

function parseRadioStartMs(raw: string | null | undefined) {
  if (!raw) return null
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? null : parsed
}

/** Delay until the next Radio.co fetch. Catch-up = last ~15s / past end. */
function nextRadioPollDelay(
  startTimeMs: number | null,
  totalDurationSec: number | null,
  nowMs: number,
): { delayMs: number; catchUp: boolean } {
  if (startTimeMs == null || totalDurationSec == null) {
    return { delayMs: WTED_RADIO_STATUS_POLL_MS, catchUp: false }
  }
  const msUntilEnd = startTimeMs + totalDurationSec * 1000 - nowMs
  if (msUntilEnd <= WTED_RADIO_STATUS_POLL_MS) {
    return { delayMs: RADIO_POLL_FLOOR_MS, catchUp: true }
  }
  return {
    delayMs: Math.min(
      RADIO_POLL_CEILING_MS,
      Math.max(RADIO_POLL_FLOOR_MS, msUntilEnd - WTED_RADIO_STATUS_POLL_MS),
    ),
    catchUp: false,
  }
}

type RadioStatusPoll = {
  title: string | null
  startTimeMs: number | null
  artworkUrl: string | null
}

type RadioDurationPoll = {
  totalDuration: number | null
  startTimeMs: number | null
}

export function useIosRadioPlayer(enabled = true): IosRadioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const wantPlayRef = useRef(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const artworkTitleRef = useRef<string | null>(null)
  const artworkAttemptsRef = useRef(0)
  const volumeRef = useRef(1)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [rawTitle, setRawTitle] = useState<string | null>(null)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null)
  const [totalDuration, setTotalDuration] = useState<number | null>(null)
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null)
  const [volume, setVolumeState] = useState(1)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const parsed = rawTitle ? parseRadioNowPlayingTitle(rawTitle) : null
  const displayTitle = parsed?.primary ?? WTED_RADIO_NAME
  const displayArtist = parsed?.secondary ?? null

  const elapsed =
    startTimeMs != null && totalDuration != null ?
      clampElapsed((nowMs - startTimeMs) / 1000, totalDuration)
    : null
  const remaining =
    elapsed != null && totalDuration != null ?
      Math.max(0, totalDuration - elapsed)
    : null

  const clearReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    wantPlayRef.current = false
    clearReconnect()
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
    }
    setIsPlaying(false)
    setIsBuffering(false)
  }, [clearReconnect])

  const setVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, value))
    volumeRef.current = next
    setVolumeState(next)
    if (audioRef.current) audioRef.current.volume = next
  }, [])

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    wantPlayRef.current = true
    clearReconnect()
    audio.volume = volumeRef.current
    audio.src = WTED_RADIO_STREAM_URL
    setIsBuffering(true)
    void audio.play().catch(() => {
      if (!wantPlayRef.current) return
      setIsPlaying(false)
      setIsBuffering(false)
    })
  }, [clearReconnect])

  const playRef = useRef(play)
  playRef.current = play

  const toggle = useCallback(() => {
    if (wantPlayRef.current || isPlaying) stop()
    else play()
  }, [isPlaying, play, stop])

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current)
      sleepTimerRef.current = null
    }
    setSleepTimerEnd(null)
  }, [])

  const startSleepTimer = useCallback(
    (minutes: number) => {
      cancelSleepTimer()
      const end = Date.now() + minutes * 60_000
      setSleepTimerEnd(end)
      sleepTimerRef.current = setTimeout(() => {
        stop()
        setSleepTimerEnd(null)
        sleepTimerRef.current = null
      }, minutes * 60_000)
    },
    [cancelSleepTimer, stop],
  )

  useEffect(() => {
    if (!enabled) return
    const audio = new Audio()
    audio.preload = "none"
    audio.volume = volumeRef.current
    audioRef.current = audio

    const onPlaying = () => {
      setIsPlaying(true)
      setIsBuffering(false)
    }
    const onWaiting = () => {
      if (wantPlayRef.current) setIsBuffering(true)
    }
    const onPause = () => {
      if (!wantPlayRef.current) {
        setIsPlaying(false)
        setIsBuffering(false)
      }
    }
    const scheduleReconnect = () => {
      if (!wantPlayRef.current) return
      setIsBuffering(true)
      clearReconnect()
      reconnectTimerRef.current = setTimeout(() => {
        if (wantPlayRef.current) playRef.current()
      }, 2000)
    }

    audio.addEventListener("playing", onPlaying)
    audio.addEventListener("waiting", onWaiting)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", scheduleReconnect)
    audio.addEventListener("error", scheduleReconnect)

    return () => {
      wantPlayRef.current = false
      clearReconnect()
      audio.removeEventListener("playing", onPlaying)
      audio.removeEventListener("waiting", onWaiting)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", scheduleReconnect)
      audio.removeEventListener("error", scheduleReconnect)
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
      audioRef.current = null
    }
  }, [clearReconnect, enabled])

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let previousTitle: string | null | undefined
    let catchUp = false
    let scheduleStartMs: number | null = null
    let scheduleDurationSec: number | null = null
    let lastV2PollMs = 0

    async function resolveArtwork(
      title: string,
      radioCoArtwork: string | null,
    ) {
      if (title !== artworkTitleRef.current) {
        artworkTitleRef.current = title
        artworkAttemptsRef.current = 0
        setArtworkUrl(null)
      }
      if (artworkAttemptsRef.current >= MAX_ARTWORK_ATTEMPTS) return
      artworkAttemptsRef.current += 1
      try {
        const [resolved] = await attachArtworkToRecentlyPlayedTracks([
          {
            id: title,
            title,
            startTime: "",
            artworkUrl: radioCoArtwork,
          },
        ])
        if (cancelled || title !== artworkTitleRef.current) return
        if (resolved?.artworkUrl) setArtworkUrl(resolved.artworkUrl)
      } catch {
        // Keep placeholder; later polls retry until the attempt cap.
      }
    }

    async function pollStatus(): Promise<RadioStatusPoll | null> {
      try {
        const res = await fetch(WTED_RADIO_STATUS_URL, { cache: "no-store" })
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as RadioCoStatusResponse
        if (cancelled) return null
        setIsOnline(data.status !== "offline")
        const title = data.current_track?.title?.trim() || null
        setRawTitle(title)
        const startTimeMs = parseRadioStartMs(data.current_track?.start_time)
        if (startTimeMs != null) setStartTimeMs(startTimeMs)
        const artworkUrl = data.current_track?.artwork_url?.trim() || null
        if (title) void resolveArtwork(title, artworkUrl)
        else setArtworkUrl(null)
        return { title, startTimeMs, artworkUrl }
      } catch {
        return null
      }
    }

    async function pollDuration(): Promise<RadioDurationPoll | null> {
      try {
        const res = await fetch(WTED_RADIO_V2_CURRENT_TRACK_URL, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as RadioCoV2CurrentTrackResponse
        if (cancelled) return null
        const ms = data.data?.track_playout_duration
        const totalDuration = ms && ms > 0 ? ms / 1000 : null
        setTotalDuration(totalDuration)
        const startTimeMs = parseRadioStartMs(data.data?.start_time)
        if (startTimeMs != null) setStartTimeMs(startTimeMs)
        return { totalDuration, startTimeMs }
      } catch {
        return null
      }
    }

    function isPastPredictedEnd(nowMs: number) {
      if (scheduleStartMs == null || scheduleDurationSec == null) return false
      return nowMs >= scheduleStartMs + scheduleDurationSec * 1000
    }

    function scheduleNext(delayMs: number) {
      if (cancelled) return
      timeoutId = setTimeout(() => {
        timeoutId = null
        void tick()
      }, delayMs)
    }

    function scheduleFromKnown() {
      const next = nextRadioPollDelay(
        scheduleStartMs,
        scheduleDurationSec,
        Date.now(),
      )
      catchUp = next.catchUp
      scheduleNext(next.delayMs)
    }

    async function tick() {
      if (cancelled) return
      try {
        if (catchUp) {
          const status = await pollStatus()
          if (cancelled) return
          if (!status) {
            catchUp = true
            scheduleNext(RADIO_POLL_FLOOR_MS)
            return
          }
          const titleChanged =
            previousTitle !== undefined && previousTitle !== status.title
          previousTitle = status.title
          const now = Date.now()
          const pastEnd = isPastPredictedEnd(now)
          const v2Due = now - lastV2PollMs >= WTED_RADIO_STATUS_POLL_MS
          if (!titleChanged && !(pastEnd && v2Due)) {
            catchUp = true
            scheduleNext(RADIO_POLL_FLOOR_MS)
            return
          }
          const duration = await pollDuration()
          lastV2PollMs = Date.now()
          if (cancelled) return
          if (duration) {
            scheduleStartMs = duration.startTimeMs ?? status.startTimeMs
            scheduleDurationSec = duration.totalDuration
          } else if (titleChanged) {
            scheduleStartMs = status.startTimeMs
            scheduleDurationSec = null
          }
          scheduleFromKnown()
          return
        }

        const [status, duration] = await Promise.all([
          pollStatus(),
          pollDuration(),
        ])
        lastV2PollMs = Date.now()
        if (cancelled) return
        if (status) {
          previousTitle = status.title
          if (status.startTimeMs != null) scheduleStartMs = status.startTimeMs
        }
        if (duration) {
          scheduleDurationSec = duration.totalDuration
          if (duration.startTimeMs != null) {
            scheduleStartMs = duration.startTimeMs
          }
        }
        scheduleFromKnown()
      } catch {
        if (cancelled) return
        scheduleFromKnown()
      }
    }

    void tick()
    return () => {
      cancelled = true
      if (timeoutId != null) clearTimeout(timeoutId)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    if (!("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: displayTitle,
      artist: displayArtist ?? WTED_RADIO_NAME,
      album: WTED_RADIO_NAME,
      artwork: artworkUrl ?
        [{ src: artworkUrl, sizes: "300x300", type: "image/jpeg" }]
      : [],
    })
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
    navigator.mediaSession.setActionHandler("play", () => play())
    navigator.mediaSession.setActionHandler("pause", () => stop())
    navigator.mediaSession.setActionHandler("stop", () => stop())
    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("stop", null)
    }
  }, [artworkUrl, displayArtist, displayTitle, enabled, isPlaying, play, stop])

  useEffect(() => () => cancelSleepTimer(), [cancelSleepTimer])

  return {
    isPlaying,
    isBuffering,
    isOnline,
    stationName: WTED_RADIO_NAME,
    rawTitle,
    displayTitle,
    displayArtist,
    artworkUrl,
    totalDuration,
    elapsed,
    remaining,
    volume,
    sleepTimerEnd,
    sleepOptionsMinutes: SLEEP_OPTIONS_MINUTES,
    play,
    stop,
    toggle,
    setVolume,
    startSleepTimer,
    cancelSleepTimer,
  }
}
