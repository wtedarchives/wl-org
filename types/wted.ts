export interface WtedRequestEnriched {
  id: string
  entry_id: string
  requested_at: string
  entry_song: string
  entry_short: string | null
  show_date: string
  show_venue_location: string | null
  show_group: string | null
  release_artwork: string | null
}

