"use client"

import { useState, useSyncExternalStore } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getResultDescription } from "@/components/dpro/setlistgame/song-selection/utils"
import { cn } from "@/lib/utils"

import { echoFontClassName } from "./echo-fonts"
import type { EchoLiveSong } from "./echo-live-data"

function subscribeHoverCapability(cb: () => void) {
  if (typeof window === "undefined") return () => {}
  const mq = window.matchMedia("(hover: none)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

function getHoverNoneSnapshot() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(hover: none)").matches
}

function useTapForScoreExplainer() {
  return useSyncExternalStore(
    subscribeHoverCapability,
    getHoverNoneSnapshot,
    () => false,
  )
}

export function EchoLiveScoreChip({ song }: { song: EchoLiveSong }) {
  const tapExplainer = useTapForScoreExplainer()
  const [open, setOpen] = useState(false)

  if (!song.chip || !song.result) {
    return <span className="echo-live-chip is-empty" />
  }

  const html = getResultDescription(
    song.result,
    song.showcloser_correct ?? false,
    song.showopener_correct ?? false,
  )
  const hoverHandlers =
    tapExplainer ?
      {}
    : {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label="How this pick was scored"
        className="echo-live-score-trigger"
        {...hoverHandlers}
      >
        <span
          className={cn("echo-live-chip", song.hit && "is-hit")}
          data-state={song.hit ? "hit" : "miss"}
        >
          {song.chip}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        sideOffset={8}
        align="center"
        className={cn(
          "echo-live-score-explainer z-[10025]",
          echoFontClassName,
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...hoverHandlers}
      >
        <div
          className="echo-live-score-explainer-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </PopoverContent>
    </Popover>
  )
}
