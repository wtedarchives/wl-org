import type { CSSProperties } from "react"

import { HOME_BG_IMAGES } from "@/components/wl-home-shared"

function fnv1a32Hex(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Pseudo-random pick per show + divider slot (stable for SSR / hydration). */
export function wlHomeV2SetlistAsideAccentTileBg(
  showId: string,
  slot: number,
): string {
  const path =
    HOME_BG_IMAGES[
      fnv1a32Hex(`${showId}\0aside-accent-${slot}`) % HOME_BG_IMAGES.length
    ]
  return `url('${path}')`
}

export function WlHomeV2SetlistAsideAccent({
  showId,
  slot,
}: {
  showId: string
  slot: number
}) {
  return (
    <div
      className="wl-home-v2-setlist-aside-top-accent"
      style={
        {
          "--tile-bg": wlHomeV2SetlistAsideAccentTileBg(showId, slot),
        } as CSSProperties
      }
      aria-hidden
    />
  )
}
