/**
 * Song update utilities for AdminSong component.
 */

import { supabase } from "@/lib/supabase"
import type { SongDataFull } from "@/types/admin"

export function transformSongForUpdate(song: SongDataFull) {
  const displayName =
    (song.song_displayname ?? "").trim() || null
  if (!displayName) {
    throw new Error("Display Name is required")
  }
  return {
    ...song,
    song_displayname: displayName,
    song_category: song.song_category === "" ? null : song.song_category,
    song_originalartist: song.song_originalartist === "" ? null : song.song_originalartist,
    song_coachnotes: song.song_coachnotes === "" ? null : song.song_coachnotes,
  }
}

export async function updateSong(songData: SongDataFull) {
  if (!supabase) throw new Error("Supabase not configured")
  const { error } = await supabase
    .from("songs")
    .update({
      song: songData.song,
      song_displayname: songData.song_displayname,
      song_category: songData.song_category,
      song_originalartist: songData.song_originalartist,
      song_categoryorder: songData.song_categoryorder,
      song_coachnotes: songData.song_coachnotes,
    })
    .eq("song_id", songData.song_id)
  if (error) throw error
  return songData
}
