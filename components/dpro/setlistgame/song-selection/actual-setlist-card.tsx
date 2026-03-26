"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SetlistEntry } from "./types"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getPlacementColor, getSetDisplayName, getSongsForActualSet } from "./utils"

interface ActualSetlistCardProps {
  actualSetlist: SetlistEntry[]
  songPicks: { set: string }[]
}

function entrySongDisplayName(entry: SetlistEntry): string | null {
  const rel = entry.songs
  if (!rel) return null
  const row = Array.isArray(rel) ? rel[0] : rel
  return row?.song_displayname ?? null
}

function getUniqueSetsFromPicksAndActual(
  picks: { set: string }[],
  actual: SetlistEntry[]
): string[] {
  const pickSets = new Set(picks.map((p) => p.set))
  const actualSets = new Set(actual.map((e) => e.entry_set))
  const all = new Set([...pickSets, ...actualSets])
  const numeric = Array.from(all)
    .filter((s) => !s.startsWith("E"))
    .sort((a, b) => parseInt(a) - parseInt(b))
  const encore = Array.from(all)
    .filter((s) => s.startsWith("E"))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
  return [...numeric, ...encore]
}

export function ActualSetlistCard({
  actualSetlist,
  songPicks,
}: ActualSetlistCardProps) {
  const uniqueSets = getUniqueSetsFromPicksAndActual(songPicks, actualSetlist)

  if (actualSetlist.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">Actual setlist</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-sm text-muted-foreground text-center py-6">
            No setlist available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-medium">Actual setlist</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          {uniqueSets.map((setId) => {
            const entries = getSongsForActualSet(actualSetlist, setId)
            if (entries.length === 0) return null
            return (
              <div
                key={setId}
                className="rounded-md border border-border overflow-hidden"
              >
                <div className="px-2 py-1 bg-muted/60">
                  <span className="text-xs font-medium">
                    {getSetDisplayName(setId)}
                  </span>
                </div>
                <div className="space-y-0.5 p-2">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.entry_id}
                      className="flex items-center gap-2 rounded-md py-0.5 px-2 hover:bg-muted/40 transition-colors"
                    >
                      <span
                        className="shrink-0 text-xs text-white px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: getPlacementColor(entry.entry_placement),
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-xs font-medium truncate min-w-0">
                        <SongDisplayName
                          song={entry.entry_song}
                          songDisplayName={entrySongDisplayName(entry)}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
