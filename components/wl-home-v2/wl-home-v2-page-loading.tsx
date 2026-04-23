"use client"

import { CircleNotch } from "@phosphor-icons/react"

/** Centered frosted panel + spinner — use for all `wl-home-v2` inner routes (Program Director, Years, etc.). */
export function WlHomeV2PageLoading({ message }: { message: string }) {
  return (
    <div className="wl-home-v2-page-loading">
      <div className="widget-panel wl-home-v2-page-loading-panel flex min-w-0 items-center justify-center gap-4">
        <CircleNotch
          className="size-6 shrink-0 animate-spin text-[var(--wl-light-orange)]"
          aria-hidden
        />
        <p className="text-base text-white/80">{message}</p>
      </div>
    </div>
  )
}
