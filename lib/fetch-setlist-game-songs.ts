import type { Song } from "@/components/dpro/setlistgame/song-selection/types"
import { supabase } from "@/lib/supabase"

/** Same catalog as setlist game song selection (hooks.ts fetchSongs). */
export async function fetchSetlistGameSongs(): Promise<Song[]> {
  if (!supabase) return []

  let allSongs: {
    song: string
    song_id: string
    song_displayname: string | null
    categories: { category_type: string } | { category_type: string }[] | null
  }[] = []
  let page = 0
  let hasMore = true
  const pageSize = 1000

  while (hasMore) {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `
          song,
          song_id,
          song_displayname,
          song_category,
          setlistgame_omit,
          categories!inner(
            category,
            category_type
          )
        `,
      )
      .in("categories.category_type", [
        "Goose",
        "Goose Misc",
        "Ted Tapes",
        "Cover Songs",
      ])
      .or("setlistgame_omit.is.null,setlistgame_omit.eq.false")
      .order("song")
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error

    if (data && data.length > 0) {
      allSongs = [...allSongs, ...data]
      page++
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  const gooseSongs: Song[] = []
  const tedTapesSongs: Song[] = []
  const coverSongs: Song[] = []

  allSongs.forEach((item) => {
    const categoryRow = Array.isArray(item.categories) ?
      item.categories[0]
    : item.categories
    const categoryType = categoryRow?.category_type

    const songData: Song = {
      song: item.song,
      song_id: item.song_id,
      song_displayname: item.song_displayname ?? null,
      category_type: categoryType,
    }

    if (categoryType === "Goose" || categoryType === "Goose Misc") {
      gooseSongs.push(songData)
    } else if (categoryType === "Ted Tapes") {
      tedTapesSongs.push(songData)
    } else if (categoryType === "Cover Songs") {
      coverSongs.push(songData)
    }
  })

  return [...gooseSongs, ...tedTapesSongs, ...coverSongs]
}
