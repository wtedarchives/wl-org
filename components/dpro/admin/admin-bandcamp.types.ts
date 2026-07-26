export interface BandcampSetlistEntry {
  entry_id: string
  entry_set: string | null
  entry_setnum: number
  entry_setorder: number
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string | null
}

export interface ScrapedTrack {
  track_id: number
  title: string
  track_link: string
}

export interface ScrapedAlbum {
  album_id: number
  album_url: string
  album_title: string | null
  tracks: ScrapedTrack[]
}

/** The Bandcamp track assigned to a given setlist entry (from DB or a fresh pick). */
export interface TrackAssignment {
  track_id: number
  track_link: string
  track_title: string | null
  album_id: number
  album_url: string | null
}
