/**
 * Builds the view model the server-side schedule renderer draws from.
 *
 * The renderer is stateless and timezone-blind on purpose: every time and date
 * string is formatted HERE, in the viewer's own locale and timezone, because a
 * Lambda in us-east-1 has no idea what "today" means to the person asking. It
 * is the same split the setlist card uses — the caller holds the data and
 * builds the model, the renderer only rasterises.
 *
 * Row text comes from `resolveRadioScheduleSlotTitle`, the same helper the
 * homepage's Upcoming Schedule panel uses, so the card and the site say the
 * same thing about a slot. That helper already folds the show name into the
 * title (`Ted Tracks · Vol. 011`) or replaces it with the linked show's archive
 * title, which is why the card has no separate show line.
 */
import {
  formatRadioScheduleTimeRange,
  type RadioScheduleSlot,
} from "@/hooks/use-radio-schedule"
import { resolveRadioScheduleSlotTitle } from "@/lib/wted-episodes-schedule-lookup"
import type {
  ScheduleCardRow,
  ScheduleCardViewModel,
} from "@/supabase/functions/_shared/schedule-share-card/card.ts"

/** Row art uses a smaller radius when the resolved title matches this episode only. */
const RADIO_SHARE_EXPORT_RANDY_REQUEST_DISPLAY_TITLE = "requesTED w/ Randy"

/** Unique per Radio.co slot; a playlist can air more than once in a day. */
function scheduleShareRowKey(slot: RadioScheduleSlot): string {
  return `${slot.event.event_id}-${slot.event.start}`
}

export function formatScheduleShareDateLabel(day: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(day)
}

export function buildScheduleShareCardViewModel(
  scheduleDay: Date,
  slots: RadioScheduleSlot[],
): ScheduleCardViewModel {
  const rows: ScheduleCardRow[] = []

  for (const slot of slots) {
    const title = resolveRadioScheduleSlotTitle(
      slot.event,
      slot.wtedEpisode,
    ).trim()
    // A row with no resolvable title has nothing to draw, as on the homepage.
    if (!title) continue

    rows.push({
      key: scheduleShareRowKey(slot),
      timeRange: formatRadioScheduleTimeRange(slot.event.start, slot.event.end),
      title,
      // A URL, not a data URI — the renderer fetches it, so a phone never has to.
      artSrc:
        slot.wtedEpisode?.artwork?.trim() ||
        slot.event.playlist.artwork?.trim() ||
        null,
      tightArtRadius: title === RADIO_SHARE_EXPORT_RANDY_REQUEST_DISPLAY_TITLE,
    })
  }

  return {
    dateLabel: formatScheduleShareDateLabel(scheduleDay),
    rows,
    emptyMessage: "No shows scheduled for this calendar day.",
  }
}
