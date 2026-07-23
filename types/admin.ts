/**
 * Admin panel types. Same schema as dripfield.pro.
 */

/** Basic show data for useAdminSetlist (show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid) */
export interface ShowData {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string | null
  show_canonid: number | null
}

export interface AdminShowData {
  show_id: string
  show_date: string
  show_canonid: number | null
  show_group: string
  show_tour: string
  show_subvenue: string
  show_subvenue_venue: string | null
  show_venue_location: string | null
  show_iscanon: boolean
  show_year: string
  show_issetlistgame: boolean
  show_detail: string | null
  show_alert?: string | null
  show_coachnotes?: string | null
  show_time?: string | null
  show_callbacks?: string | null
  show_wl_link?: string | null
  show_setlistcomplete?: boolean | null
  discography_display?: boolean | null
  show_dripfieldcomplete?: boolean | null
  show_jivecomplete?: boolean | null
  show_listcategorycomplete?: string | null
}

export interface AdminSetlistEntryData {
  entry_id: string
  entry_set: string | null
  entry_setnum: number
  entry_setorder: number
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  entry_length: string | null
  entry_placement: string | null
  entry_coachnotes: string | null
  entry_new: string | null
  entry_show: string
}

export interface ReleaseShow {
  release_id: string
  release_order: number
  releases: {
    release_displayname: string
    release_service: string | null
  }
}

export interface GroupData {
  group: string
}

export interface TourData {
  tour: string
  tour_canonid: number
}

/** Subvenue for admin subvenue management (subvenues table: subvenue_venue = venue name) */
export interface SubvenueData {
  subvenue: string
  subvenue_venue: string
  subvenue_startdate: string | null
  subvenue_enddate: string | null
}

/** Subvenue for show dropdown (subvenue_venue_location from join) */
export interface SubvenueDisplayData {
  subvenue: string
  subvenue_venue_location: string | null
}

export interface YearData {
  year: string
}

export interface SongData {
  song: string
  song_id: string
}

export interface SongDataFull {
  song: string
  song_id: string
  song_displayname: string | null
  song_category: string | null
  song_originalartist: string | null
  song_categoryorder: number | null
  song_coachnotes: string | null
}

/** Venue data for admin venue management */
export interface VenueData {
  venue: string
  venue_location: string
  venue_coachnotes: string | null
  venue_global: boolean
  venue_address: string | null
  venue_latitude: string | null
  venue_longitude: string | null
}

/** Venue data for subvenue form (venue + venue_location only) */
export interface VenueDataBasic {
  venue: string
  venue_location: string
}

/** Setlist options from sets table */
export interface SetOptions {
  set: string
}

/** Setnum options from setnums table */
export interface SetnumOptions {
  setnums: number
}

/** Segue options from segues table */
export interface SegueOptions {
  segues: string
}

/** Placement options from placements table */
export interface PlacementOptions {
  placements: string
}

/** Song options for setlist entry */
export interface SongOptions {
  song: string
  song_id: string
}

/** Short options from song_shorts table */
export interface ShortOptions {
  song_shorts: string
}

/** Guest category for setlist entry modal */
export interface GuestCategory {
  category: string
  guests: {
    guest_id: string
    guest: string
    guest_displayname?: string | null
    guest_instrument?: string | null
    guest_category?: string | null
  }[]
}

/** Show change data */
export interface ShowChangeData {
  show_change_uuid: string
  show_id: string
  change_order: number
  change_type: string
  change: string
}

/** Release for AdminReleases */
export interface ReleaseData {
  release_id: string
  release: string
  release_displayname: string
  release_link: string | null
  release_service: string | null
  release_artwork: string | null
}

/** Discography row for AdminDiscography */
export interface DiscographyAdminRecord {
  uuid: string
  name: string
  displayname: string
  artist: string
  category: string
  artwork: string
  canon_id: number
  release_date: string | null
  coach_notes: string | null
}

/** Join table: setlist lines linked to a discography release */
export interface DiscographyEntryLink {
  uuid: string
  setlist_entry: string
  discography_entry: string
  order: number
}

/** Artist credit on a show poster (`show_posters.artist` jsonb) */
export interface ShowPosterArtist {
  name: string
  link: string
}

/** Row from `show_posters` for Admin Poster tab */
export interface ShowPosterRecord {
  uuid: string
  show: string[] | null
  tour: string[] | null
  artist: ShowPosterArtist[] | null
  print_run: number | null
  description: string | null
  image: string | null
}

export type AdminShowDataBasic = ShowData
