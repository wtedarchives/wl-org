/**
 * Song update utilities for AdminSong component.
 */

import { supabase } from "@/lib/supabase"
import type { SongDataFull } from "@/types/admin"

export function transformSongForUpdate(song: SongDataFull) {
  return {
    ...song,
    song_category: song.song_category === "" ? null : song.song_category,
    song_originalartist: song.song_originalartist === "" ? null : song.song_originalartist,
    song_coachnotes: song.song_coachnotes === "" ? null : song.song_coachnotes,
  }
}

export async function updateSong(songData: SongDataFull) {
  if (!supabase) throw new Error("Supabase not configured")
  const { error } = await supabase.rpc("update_song", {
    song_id_param: songData.song_id,
    song_param: songData.song,
    song_category_param: songData.song_category,
    song_originalartist_param: songData.song_originalartist,
    song_categoryorder_param: songData.song_categoryorder,
    song_coachnotes_param: songData.song_coachnotes,
  })
  if (error) throw error
  return songData
}
