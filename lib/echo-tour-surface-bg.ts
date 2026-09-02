import type { CSSProperties } from "react"

import { WL_HOME_V2_SHARE_BACKGROUNDS } from "@/lib/wl-home-v2-share-backgrounds"

/** Stable pseudo-random homepage tile bg per container (one of four newbg assets). */
export function echoTourSurfaceBgStyle(seed: string): CSSProperties {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const bg = WL_HOME_V2_SHARE_BACKGROUNDS[hash % WL_HOME_V2_SHARE_BACKGROUNDS.length]!
  return { "--echo-tour-bg": `url('${bg}')` } as CSSProperties
}
