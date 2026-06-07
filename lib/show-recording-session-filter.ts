/** Matches shows whose `show_detail` contains this phrase anywhere. */
export const RECORDING_SESSION_DETAIL_PHRASE = "Recording Session" as const

export function isRecordingSessionShowDetail(
  showDetail: string | null | undefined,
): boolean {
  if (!showDetail) return false
  return showDetail.includes(RECORDING_SESSION_DETAIL_PHRASE)
}

export function isRecordingSessionShow(
  show: { show_detail?: string | null } | null | undefined,
): boolean {
  return isRecordingSessionShowDetail(show?.show_detail)
}

type EmbedShow = { show_detail?: string | null }

export function isRecordingSessionEmbedShow(
  show: EmbedShow | EmbedShow[] | null | undefined,
): boolean {
  if (show == null) return false
  const row = Array.isArray(show) ? show[0] : show
  return isRecordingSessionShow(row)
}

export function excludeRecordingSessionShows<
  T extends { show_detail?: string | null },
>(shows: T[]): T[] {
  return shows.filter((show) => !isRecordingSessionShow(show))
}

export function excludeRecordingSessionSetlistEntries<
  T extends { shows?: EmbedShow | EmbedShow[] | null },
>(entries: T[]): T[] {
  return entries.filter((entry) => !isRecordingSessionEmbedShow(entry.shows))
}
