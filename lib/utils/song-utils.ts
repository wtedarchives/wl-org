/**
 * Song update utilities for AdminSong component.
 */

import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
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

export async function updateSong(songData: SongDataFull, accessToken: string | null) {
  if (!accessToken) throw new Error("You must be signed in")
  const patch = {
    song: songData.song,
    song_displayname: songData.song_displayname,
    song_category: songData.song_category,
    song_originalartist: songData.song_originalartist,
    song_categoryorder: songData.song_categoryorder,
    song_coachnotes: songData.song_coachnotes,
  }
  const { error } = await invokeDproAdmin(accessToken, {
    action: "songs_update",
    song_id: songData.song_id,
    patch,
  })
  if (error) throw new Error(error)
  return songData
}
