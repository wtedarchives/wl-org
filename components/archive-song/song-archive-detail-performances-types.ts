import type { SetlistWtedShowContext } from "@/components/dpro/setlist/setlist-wted-panel.lib"
import type { SetlistEntry } from "@/types/setlist"

/** WTED icon column — same modal/login flow as {@link WlHomeV2SetlistTable}. */
export type SongArchivePerformanceWtedPayload = {
  entry: SetlistEntry
  show: SetlistWtedShowContext
}
