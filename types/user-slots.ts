export interface UserSongEntryWithId {
  song: string
  song_displayname?: string | null
  setnum: number
  song_id?: string
}

export interface UserSlotShowData {
  show_id: string
  Show_Date: string
  Set_1_Opener: UserSongEntryWithId[] | null
  Set_1_Closer: UserSongEntryWithId[] | null
  Set_2_Opener: UserSongEntryWithId[] | null
  Set_2_Closer: UserSongEntryWithId[] | null
  Set_3_Opener: UserSongEntryWithId[] | null
  Set_3_Closer: UserSongEntryWithId[] | null
  Set_4_Opener: UserSongEntryWithId[] | null
  Set_4_Closer: UserSongEntryWithId[] | null
  Set_5_Opener: UserSongEntryWithId[] | null
  Set_5_Closer: UserSongEntryWithId[] | null
  Set_6_Opener: UserSongEntryWithId[] | null
  Set_6_Closer: UserSongEntryWithId[] | null
  Encore_1: UserSongEntryWithId[] | null
  Encore_2: UserSongEntryWithId[] | null
  Encore_3: UserSongEntryWithId[] | null
  [key: string]: string | UserSongEntryWithId[] | null
}
