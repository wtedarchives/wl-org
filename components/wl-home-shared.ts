import { cn } from "@/lib/utils"

/** Matches `id` on the scrollable region in `app/(main)/layout.tsx`. */
export const MAIN_INSET_SCROLL_ID = "main-inset-scroll"

export const HOME_BG_ROTATION_MS = 5000

export const HOME_BG_IMAGES = [
  "/newbg.png",
  "/newbg2.jpeg",
  "/newbg3.jpeg",
  "/newbg4.jpeg",
] as const

/** Songs archive: Cover Songs (299) & Miscellaneous Covers (300) tile backdrops */
export const SONGS_ARCHIVE_COVER_DUAL_HOME_BG = HOME_BG_IMAGES[0]
export const SONGS_ARCHIVE_COVER_WIDE_HOME_BG = HOME_BG_IMAGES[1]

/** Hero blurb: label + hover underline (focus ring added on interactive root). */
export const welcomeHeroInlineLinkTextClassName = cn(
  "font-bold text-wl-orange underline-offset-2 transition-colors",
  "decoration-wl-white/45 hover:cursor-pointer hover:underline hover:decoration-wl-orange hover:text-wl-light-orange",
)

export const welcomeHeroInlineLinkFocusClassName =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-orange/80"

export const welcomeHeroInlineLinkClassName = cn(
  welcomeHeroInlineLinkTextClassName,
  welcomeHeroInlineLinkFocusClassName,
)

/** Smooth-scroll document and/or main inset to top, then run `pulse`. */
export function scrollMainInsetToTopThenPulse(pulse: () => void) {
  const inset = document.getElementById(MAIN_INSET_SCROLL_ID)
  const winY = window.scrollY
  const insetNeedsScroll = inset != null && inset.scrollTop > 0
  const windowNeedsScroll = winY > 0

  if (!insetNeedsScroll && !windowNeedsScroll) {
    pulse()
    return
  }

  let done = false
  const fire = () => {
    if (done) return
    done = true
    pulse()
  }

  if (insetNeedsScroll) {
    inset.scrollTo({ top: 0, behavior: "smooth" })
  }
  if (windowNeedsScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const useScrollEnd = "onscrollend" in window
  if (insetNeedsScroll && useScrollEnd) {
    inset.addEventListener("scrollend", fire, { once: true })
    globalThis.setTimeout(fire, 900)
  } else {
    globalThis.setTimeout(fire, windowNeedsScroll ? 600 : 480)
  }
}
