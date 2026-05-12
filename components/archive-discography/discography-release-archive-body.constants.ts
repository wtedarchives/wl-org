import type { CSSProperties } from "react"

/** Same main-column photo + green wash as WL v2 setlist (`WlHomeV2SetlistPlaceholderView`). */
export const DISCOGRAPHY_V2_MAIN_TILE_STYLE = {
  "--tile-bg": "url('/newbg3.jpeg')",
} as CSSProperties

export const WL_V2_DISCOGRAPHY_PAGE_CLASS =
  "wl-home-v2-years-page songs-archive-verbatim wl-home-v2-songs-archive-page wl-home-v2-discography-release-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col"

export const EMPTY_WTED_SHOW = {
  show_date: "",
  show_venue_location: null as string | null,
  show_group: null as string | null,
}
