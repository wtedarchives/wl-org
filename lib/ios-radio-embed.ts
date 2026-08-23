/** Standalone `IosRadioBar` page iframed by Community `<wl-header>`. */
export const IOS_RADIO_EMBED_PATH = "/embed/radio"

export function isIosRadioEmbedPath(pathname: string | null | undefined) {
  return (
    pathname === IOS_RADIO_EMBED_PATH ||
    pathname === `${IOS_RADIO_EMBED_PATH}/`
  )
}

/** True when this document is inside an iframe (incl. cross-origin parent). */
export function isEmbeddedIframe() {
  if (typeof window === "undefined") return false
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

/**
 * Strip `?…` on `/embed/radio` before the App Router hydrates. Unknown query
 * on a static export is a client 404 (full site header inside `<wl-header>`).
 */
export const STRIP_IOS_RADIO_EMBED_SEARCH =
  "try{var p=location.pathname;if((p===\"/embed/radio\"||p===\"/embed/radio/\")&&location.search)history.replaceState(null,\"\",p+location.hash)}catch(e){}"

