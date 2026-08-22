/** Standalone `IosRadioBar` page iframed by Community `<wl-header>`. */
export const IOS_RADIO_EMBED_PATH = "/embed/radio"

export function isIosRadioEmbedPath(pathname: string | null | undefined) {
  return (
    pathname === IOS_RADIO_EMBED_PATH ||
    pathname === `${IOS_RADIO_EMBED_PATH}/`
  )
}
