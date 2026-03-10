/** Tour from tours table */
export interface Tour {
  tour: string
  tour_canonid: number
  tour_id: string
  tour_showfields?: boolean
}

/** Show with processed fields for tour display */
export interface TourShow {
  show_iscanon: boolean
  show_tour: string
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_detail: string | null
  show_alert: string | null
  show_canonid: number | null
  show_venue_location: string | null
  show_subvenue_venue?: string
  venue_id?: string
  attended?: boolean
  show_wl_link?: string | null
  show_length?: string | null
  show_rarity?: string | null
  show_gap?: string | null
    setlist_entries?: Array<{
    entry_length: string | null
    entry_song: string
    entry_placement?: string
    entry_setnum?: number
    entry_short?: string | null
    songs?: {
      song_category?: string
      song_originalartist?: string
      song_displayname?: string | null
      categories?: { category_canonid?: number; category_artwork?: string }
    }
  }>
}

export interface SongEntryWithId {
  song: string
  song_displayname?: string | null
  setnum: number
  song_id?: string
}

export interface SlotShowData {
  show_id: string
  Show_Date: string
  Set_1_Opener: SongEntryWithId[] | null
  Set_1_Closer: SongEntryWithId[] | null
  Set_2_Opener: SongEntryWithId[] | null
  Set_2_Closer: SongEntryWithId[] | null
  Set_3_Opener: SongEntryWithId[] | null
  Set_3_Closer: SongEntryWithId[] | null
  Set_4_Opener: SongEntryWithId[] | null
  Set_4_Closer: SongEntryWithId[] | null
  Set_5_Opener: SongEntryWithId[] | null
  Set_5_Closer: SongEntryWithId[] | null
  Encore_1: SongEntryWithId[] | null
  Encore_2: SongEntryWithId[] | null
  Encore_3: SongEntryWithId[] | null
  [key: string]: string | SongEntryWithId[] | null
}

export interface SlotData {
  title: string
  headerLeft: string
  headerRight: string
  data: Array<{
    left: string
    right: string | number
    artwork?: string
    displayName?: string | null
  }>
}
