export interface UserGuest {
  guest_id: string
  guest: string
  guest_category: string
  song_count: number
  show_count: number
}

export interface GuestsByCategory {
  [category: string]: {
    guests: UserGuest[]
    count: number
  }
}
