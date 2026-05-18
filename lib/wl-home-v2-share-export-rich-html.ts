/**
 * Share export renders HTML via `dangerouslySetInnerHTML` and captures with html-to-image.
 * Layout engines often ignore padding/margin on `<br>`, so breaks are turned into a block
 * spacer with a fixed height (styled in `wl-home-v2-setlist-share-export.css`).
 */
const SHARE_EXPORT_BR_RE = /<br\b[^>]*\/?>/gi

export function prepareWlHomeV2ShareExportRichHtml(html: string): string {
  if (!html) return html
  return html.replace(
    SHARE_EXPORT_BR_RE,
    '<span class="wl-home-v2-share-export__rich-br-gap" aria-hidden="true"></span>',
  )
}
