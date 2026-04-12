export interface WtedRequestEnrichedSegment {
  song: string
  song_displayname: string | null
  entry_short: string | null
}

export interface WtedRequestEnriched {
  id: string
  radio_id: string
  requested_at: string
  segments: WtedRequestEnrichedSegment[]
  show_date: string
  show_venue_location: string | null
  show_group: string | null
  release_artwork: string | null
}
