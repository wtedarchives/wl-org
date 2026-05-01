/**
 * Matches `SongLyrics` (`components/dpro/song/song-lyrics.tsx`): wrap [labels] for
 * emphasis; any other markup in `song_lyrics` passes through via `dangerouslySetInnerHTML`.
 */
export function formatLyricsHtml(lyrics: string): string {
  return lyrics.replace(
    /\[(.*?)\]/g,
    '<span class="lyrics-bracket-tag">[$1]</span>',
  )
}

export function categoryInitials(category: string): string {
  const parts = category.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
