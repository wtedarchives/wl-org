import type { RadioScheduleSlot } from "@/hooks/use-radio-schedule"
import { formatOnAirEpisodeSubtext } from "@/lib/wted-episodes-schedule-lookup"

/** `show · display_name` for the schedule slot that contains `nowMs`, if any. */
export function episodeSubtextFromScheduleSlots(
  slots: RadioScheduleSlot[],
  nowMs: number = Date.now(),
): string | null {
  const current = slots.find((slot) => {
    const start = Date.parse(slot.event.start)
    const end = Date.parse(slot.event.end)
    if (Number.isNaN(start) || Number.isNaN(end)) return false
    return nowMs >= start && nowMs < end
  })
  return formatOnAirEpisodeSubtext(current?.wtedEpisode ?? null)
}
