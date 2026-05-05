export interface Guest {
  guest_display_name: string
  guest_id: string
  guest_canonid: number
  guest_instrument: string
  /** e.g. "Goose (current)", "Goose (former)", "Group", "Guest" */
  guest_category?: string | null
}

export interface Show {
  show_id: string
  show_date: string
  show_group: string
  show_detail: string | null
  show_subvenue: string
  show_venue_location: string
  show_alert: string | null
  show_coachnotes: string | null
  show_canonid: number | null
  show_tour: string | null
  show_callbacks: string | null
  tour_showfields: boolean
  tour_id: string
  show_wl_link?: string | null
  show_subvenue_venue?: string | null
  venue_id?: string | null
  rating_visibility?: boolean
  show_rarity?: number | null
  show_gap?: number | null
  show_length?: string | null
  show_listcategorycomplete?: string | null
  show_jivecomplete?: boolean
  show_dripfieldcomplete?: boolean
  /** When false, WL Home v2 setlist omits set rail, set-break dividers, and # placement bars. */
  discography_display?: boolean | null
  /** When true, show ElGoose.Net data attribution on the setlist page. */
  egn_sourced?: boolean | null
}

export interface SetlistEntry {
  entry_id: string
  entry_set: string
  entry_setnum: number
  entry_song: string
  entry_short: string | null
  entry_segue: string | null
  entry_length: string | null
  entry_placement: string
  entry_coachnotes: string | null
  entry_setorder: number
  entry_show: string
  radio_id?: string | null
  song_tour_count: string | null
  last_count: string | null
  song_id: string
  last_show_id: string | null
  last_show_tour: string | null
  last_show_subvenue: string | null
  last_venue: string | null
  last_venue_location: string | null
  last_show_date: string | null
  times_played: string | null
  shows_since_debut: string | null
  song_rarity_percentage: string | null
  times_played_num: number | null
  shows_since_debut_num: number | null
  guests: {
    guest_display_name: string
    guest_id: string
    guest_canonid: number
    guest_instrument: string
    guest_category?: string | null
  }[]
  song_category: string
  category_canonid: number
  joty_round?: string | null
  songs: {
    song_id: string
    song: string
    song_displayname: string | null
    song_category: string
    song_originalartist: string | null
    categories: {
      category_canonid: number
      category_artwork: string | null
    }
  }
}

export interface GuestGroup {
  color: string
  guests: Guest[]
}

export interface ShowDate {
  show_id: string
  show_date: string
  formatted_show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string | null
  show_detail: string | null
  show_alert: string | null
  show_rarity_percentage: string | null
  total_entry_length: string | null
  show_canonid: number | null
}

export interface ShowPosition {
  current: number
  total: number
  prevShowId: string | null
  nextShowId: string | null
}

/** Per-row “Show” cell data on discography track table when source show has discography_display. */
export interface DiscographyShowColumnCell {
  showId: string
  /** From `subvenues.venues.venue_id` (same as tour shows). */
  venueId: string | null
  /** `shows.show_subvenue_venue` when linking by slug (`/archive/venue/...`), matching TourShowRow. */
  venueSlug: string | null
  dateLabel: string
  venueLabel: string | null
}

export interface ModalSongData {
  isOpen: boolean
  songName: string
}
