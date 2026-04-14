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

/** Smooth-scroll main column to top, then run `pulse` (for browsers without `scrollend`, uses a short delay). */
export function scrollMainInsetToTopThenPulse(pulse: () => void) {
  const el = document.getElementById(MAIN_INSET_SCROLL_ID)
  if (!el || el.scrollTop <= 0) {
    pulse()
    return
  }
  let done = false
  const fire = () => {
    if (done) return
    done = true
    pulse()
  }
  el.scrollTo({ top: 0, behavior: "smooth" })
  const useScrollEnd = "onscrollend" in window
  if (useScrollEnd) {
    el.addEventListener("scrollend", fire, { once: true })
  }
  globalThis.setTimeout(fire, useScrollEnd ? 900 : 480)
}
