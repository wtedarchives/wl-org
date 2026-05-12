import type { UserPick } from "@/hooks/use-user-picks"

/** Minimal show shape needed for song selection (compatible with GameShow from either hook). */
export interface ShowForSongSelection {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string
  show_time: string
  show_tour: string
  show_detail?: string | null
  show_scored?: boolean
  timeRemaining?: string
  isSelectionClosed?: boolean
  submission_id?: string
}

export interface SongSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  show: ShowForSongSelection
  existingPicks: UserPick[]
  isEditing: boolean
  viewMode: boolean
  submissionDetails?: {
    totalScore: number
    songsPicked: number
    songsPlayed: number
    setlist: Array<{
      entry_song: string
      entry_set: string
      entry_setnum: number
      entry_placement: string
    }>
  }
  onSuccess?: () => void
}
