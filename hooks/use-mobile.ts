import * as React from "react"

const MOBILE_BREAKPOINT = 768

/** Breakpoint (px) at which main content switches to desktop layout (e.g. setlist page sidebar). */
export const DESKTOP_CONTENT_MIN_WIDTH = 1280

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
