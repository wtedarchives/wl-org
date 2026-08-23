/** postMessage from `/embed/radio` so Community `<wl-header>` can open the setlist. */
export const IOS_RADIO_EMBED_SETLIST_SOURCE = "wl-ios-radio"
export const IOS_RADIO_EMBED_SETLIST_TYPE = "setlist"

export type IosRadioEmbedSetlistMessage = {
  source: typeof IOS_RADIO_EMBED_SETLIST_SOURCE
  type: typeof IOS_RADIO_EMBED_SETLIST_TYPE
  url: string | null
  title: string | null
}
