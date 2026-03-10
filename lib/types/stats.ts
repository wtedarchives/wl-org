export interface TopSong {
  song: string
  song_displayname?: string | null
  song_id: string
  play_count: number
  category_canonid: number
  category_artwork?: string
}

export interface ShowOpener {
  song_name: string
  song_displayname?: string | null
  song_id: string
  times_played: number
  category_canonid: number
  category_artwork?: string
}

export interface SetOpener {
  song_name: string
  song_id: string
  times_played: number
  category_canonid: number
  category_artwork?: string
}

export interface SetCloser {
  song_name: string
  song_id: string
  times_played: number
  category_canonid: number
  category_artwork?: string
}

export interface Encore {
  song_name: string
  song_id: string
  times_played: number
  category_canonid: number
  category_artwork?: string
}

export interface NotPlayedSong {
  song: string
  song_displayname?: string | null
  song_id: string
  play_count: number
  category_canonid: number
  category_artwork?: string
}

export interface LongestSong {
  song: string
  song_displayname?: string | null
  song_id: string
  entry_length: string
  show_date?: string
  show_id?: string
  venue_location?: string
  category_artwork?: string
}

export interface LiberatedSong {
  song: string
  song_displayname?: string | null
  song_id: string
  last_count: string | null
  last_show_date: string | null
  last_show_id: string | null
  entry_length?: string
  show_date?: string
  show_id?: string
  venue_location?: string
  category_artwork?: string
}

export interface ShowStat {
  show_id: string
  show_date: string
  show_subvenue?: string
  show_venue_location?: string
  show_tour?: string
  value: string | number
  show_length_rank?: number | null
  venue_id?: string
  tour_id?: string
}
