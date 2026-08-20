import type { RadioScheduleSlot } from "@/hooks/use-radio-schedule"
import { formatOnAirEpisodeSubtext } from "@/lib/wted-episodes-schedule-lookup"

function currentScheduleSlot(
  slots: RadioScheduleSlot[],
  nowMs: number,
) {
  return slots.find((slot) => {
    const start = Date.parse(slot.event.start)
    const end = Date.parse(slot.event.end)
    if (Number.isNaN(start) || Number.isNaN(end)) return false
    return nowMs >= start && nowMs < end
  })
}

/** `show · display_name` for the schedule slot that contains `nowMs`, if any. */
export function episodeSubtextFromScheduleSlots(
  slots: RadioScheduleSlot[],
  nowMs: number = Date.now(),
): string | null {
  return formatOnAirEpisodeSubtext(currentScheduleSlot(slots, nowMs)?.wtedEpisode ?? null)
}

/** Upcoming-schedule artwork for the slot that contains `nowMs`. */
export function episodeArtworkFromScheduleSlots(
  slots: RadioScheduleSlot[],
  nowMs: number = Date.now(),
): string | null {
  const art = currentScheduleSlot(slots, nowMs)?.wtedEpisode?.artwork?.trim()
  return art ? art : null
}
