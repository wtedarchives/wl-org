import * as React from "react"

/** Tailwind `md` (px); matches `useIsMinMd` / `(min-width: 768px)`. */
export const MOBILE_BREAKPOINT = 768

/** Breakpoint (px) at which main content switches to desktop layout (nav bar, setlist sidebar, wl-home-v2 tiles, etc.). */
export const DESKTOP_CONTENT_MIN_WIDTH = 1344

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * True below {@link DESKTOP_CONTENT_MIN_WIDTH} (1344px).
 * Used for persistent radio (top bar vs home/sidebar slots) and wl-home-v2 header nav. Not general “phone” UI — that stays at 768 (`useIsMobile`).
 */
export function useIsBelowXl() {
  const [belowXl, setBelowXl] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${DESKTOP_CONTENT_MIN_WIDTH - 1}px)`,
    )
    const onChange = () => {
      setBelowXl(window.innerWidth < DESKTOP_CONTENT_MIN_WIDTH)
    }
    mql.addEventListener("change", onChange)
    setBelowXl(window.innerWidth < DESKTOP_CONTENT_MIN_WIDTH)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!belowXl
}

/** True when viewport is at or above the desktop content breakpoint (e.g. full breadcrumbs, setlist sidebar). */
export function useIsDesktopContentLayout() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_CONTENT_MIN_WIDTH}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_CONTENT_MIN_WIDTH)
    }
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= DESKTOP_CONTENT_MIN_WIDTH)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isDesktop !== false
}

/** Tailwind `md` (768px). */
export function useIsMinMd() {
  const [match, setMatch] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = () => {
      setMatch(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setMatch(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return match
}

/** Tailwind `lg` (1024px): true when viewport is below that width. */
export function useIsBelowLg() {
  const LG_BREAKPOINT = 1024
  const [belowLg, setBelowLg] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setBelowLg(window.innerWidth < LG_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setBelowLg(window.innerWidth < LG_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!belowLg
}

/** At/above {@link DESKTOP_CONTENT_MIN_WIDTH} — home WTED cards: 3-column grid; accordion below. */
export function useIsMinXl() {
  const [match, setMatch] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_CONTENT_MIN_WIDTH}px)`)
    const onChange = () => {
      setMatch(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setMatch(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return match
}
