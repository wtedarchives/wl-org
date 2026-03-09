"use client"

interface SongLyricsProps {
  lyrics: string | null
}

export function SongLyrics({ lyrics }: SongLyricsProps) {
  if (!lyrics || !lyrics.trim()) return null

  const formattedLyrics = lyrics.replace(
    /\[(.*?)\]/g,
    '<span class="font-medium">[$1]</span>',
  )

  return (
    <div className="xl:sticky xl:top-4">
      <div className="rounded-lg border border-border/60 bg-card/80 overflow-hidden shadow-sm">
        <div className="bg-muted/60 px-3 py-2">
          <h3 className="text-sm font-semibold">Lyrics</h3>
        </div>
        <div className="px-3 py-3">
          <div
            className="text-xs leading-relaxed text-muted-foreground [&_.font-medium]:text-foreground"
            dangerouslySetInnerHTML={{ __html: formattedLyrics }}
          />
        </div>
      </div>
    </div>
  )
}
