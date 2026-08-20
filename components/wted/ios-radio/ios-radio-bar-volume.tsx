"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  SpeakerHigh,
  SpeakerLow,
  SpeakerSlash,
} from "@phosphor-icons/react"

import { useIosRadioPlayerContext } from "@/components/wted/ios-radio/ios-radio-player-context"

const IDLE_HIDE_MS = 2000

function VolumeIcon({ volume }: { volume: number }) {
  if (volume <= 0) return <SpeakerSlash size={22} weight="fill" aria-hidden />
  if (volume < 0.5) return <SpeakerLow size={22} weight="fill" aria-hidden />
  return <SpeakerHigh size={22} weight="fill" aria-hidden />
}

export function IosRadioBarVolume({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { volume, setVolume } = useIosRadioPlayerContext()
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      onOpenChange(false)
      hideTimerRef.current = null
    }, IDLE_HIDE_MS)
  }, [clearHideTimer, onOpenChange])

  useEffect(() => {
    if (open) scheduleHide()
    else clearHideTimer()
    return clearHideTimer
  }, [open, scheduleHide, clearHideTimer])

  const onInteract = useCallback(() => {
    if (open) scheduleHide()
  }, [open, scheduleHide])

  return (
    <div
      className="ios-radio-bar__volume"
      onPointerDown={onInteract}
      style={{ ["--ios-radio-volume" as string]: String(volume) }}
    >
      <div
        className={
          open ?
            "ios-radio-bar__slider-wrap is-open"
          : "ios-radio-bar__slider-wrap"
        }
      >
        <input
          type="range"
          className="ios-radio-bar__slider"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          aria-label="Volume"
          onChange={(e) => {
            setVolume(Number(e.target.value))
            onInteract()
          }}
        />
      </div>
      <button
        type="button"
        className="ios-radio-bar__volume-btn"
        aria-label="Volume"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <VolumeIcon volume={volume} />
      </button>
    </div>
  )
}
