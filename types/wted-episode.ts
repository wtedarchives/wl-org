import type { SetlistEntry } from "@/types/setlist"

export type WtedEpisodeTableRow = {
  refId: string
  wtedSet: string | null
  wtedPlacement: string | null
  setlistEntry: SetlistEntry
  showId: string | null
  showDate: string | null
  venueLocation: string | null
  showGroup: string | null
  venueId: string | null
}
