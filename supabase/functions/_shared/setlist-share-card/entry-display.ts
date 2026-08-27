/**
 * Entry-level display rules for the setlist share card.
 *
 * Shared by the Next app and the Deno edge renderer — keep it import-free.
 * See `./set-grouping.ts` for the same arrangement and why it exists.
 */

/** If `entry_song` matches exactly, `[entry_short]` is not shown in setlist UI. */
export const ENTRY_SHORT_HIDDEN_FOR_SONGS = [
  "Charge",
  "First Call",
  "Happy Birthday to You",
  "[Trevor Reads Poetry]",
] as const

const ENTRY_SHORT_HIDDEN_FOR_SONG_SET = new Set<string>(ENTRY_SHORT_HIDDEN_FOR_SONGS)

/** Whether to render `[entry_short]` for this row. */
export function shouldShowSetlistEntryShort(
  entrySong: string | null | undefined,
  entryShort: string | null | undefined,
): boolean {
  if (!entryShort) return false
  if (entrySong != null && ENTRY_SHORT_HIDDEN_FOR_SONG_SET.has(entrySong)) return false
  return true
}

/**
 * Share export renders CMS HTML directly. Layout engines routinely ignore
 * padding and margin on `<br>`, so breaks become a block spacer instead —
 * styled in the web stylesheet, and normalised by the edge renderer.
 */
const SHARE_EXPORT_BR_RE = /<br\b[^>]*\/?>/gi

export function prepareWlHomeV2ShareExportRichHtml(html: string): string {
  if (!html) return html
  return html.replace(
    SHARE_EXPORT_BR_RE,
    '<span class="wl-home-v2-share-export__rich-br-gap" aria-hidden="true"></span>',
  )
}
