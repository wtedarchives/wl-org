import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"

/** postMessage from `/embed/radio` so Community `<wl-header>` can open the setlist. */
export const IOS_RADIO_EMBED_SETLIST_SOURCE = "wl-ios-radio"
export const IOS_RADIO_EMBED_SETLIST_TYPE = "setlist"

/** Cutover host — session JWT lives here, not on the Netlify default domain. */
export const PUBLIC_SITE_ORIGIN = "https://wtedradio.com"

export function getPublicSiteOrigin() {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location
    if (hostname === "localhost" || hostname === "127.0.0.1") return origin
  }
  return PUBLIC_SITE_ORIGIN
}

/** Absolute setlist URL on the public site (localhost keeps the current origin). */
export function getPublicSetlistArchiveUrl(showId: string) {
  return new URL(getSetlistArchiveUrl(showId), getPublicSiteOrigin()).href
}

export type IosRadioEmbedSetlistMessage = {
  source: typeof IOS_RADIO_EMBED_SETLIST_SOURCE
  type: typeof IOS_RADIO_EMBED_SETLIST_TYPE
  url: string | null
  title: string | null
}
