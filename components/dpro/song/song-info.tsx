"use client"

import Image from "next/image"
import Link from "next/link"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRarityColor } from "@/lib/setlist-utils"
import { SongPlacementPill } from "./song-placement-pill"
import type { SongData, SongStats, LastPlayed, PlacementStat } from "@/types/song"

interface SongInfoProps {
  song: SongData
  stats: SongStats
  lastPlayed: LastPlayed | null
  selectedGroup: string | null
  onGroupClick: (group: string) => void
  placementStats?: PlacementStat[]
}

export function SongInfo({
  song,
  stats,
  lastPlayed,
  selectedGroup,
  onGroupClick,
  placementStats = [],
}: SongInfoProps) {
  const hasGroupCounts = stats.groupCounts.length > 0
  const hasSongNotes = !!song.song_coachnotes
  const hasPlacementStats = placementStats.length > 0
  const cardCount = 1 + (hasGroupCounts ? 1 : 0) + (hasSongNotes ? 1 : 0) + (hasPlacementStats ? 1 : 0)

  const gridClasses =
    cardCount === 1
      ? "grid-cols-1"
      : cardCount === 2
        ? "grid-cols-1 lg:grid-cols-2"
        : cardCount === 3
          ? "grid-cols-1 lg:@[400px]/song-main:grid-cols-2 lg:@[1000px]/song-main:grid-cols-3"
          : "grid-cols-1 lg:@[400px]/song-main:grid-cols-2 lg:@[1000px]/song-main:grid-cols-4"

  return (
    <div className={`grid grid-cols-1 gap-3 ${gridClasses}`}>
      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="bg-muted/60 py-2">
          <CardTitle className="text-sm font-semibold">Song Info</CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-3">
          {song.categories?.category_artwork && (
            <Image
              src={song.categories.category_artwork}
              alt={`${song.song_category} artwork`}
              width={80}
              height={80}
              className="float-right ml-3 mb-2 size-20 rounded object-cover border border-border"
              unoptimized
            />
          )}
          <div className="space-y-2 text-sm">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Category
              </div>
              <div className="text-foreground">{song.song_category}</div>
            </div>
            {song.song_originalartist && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Original Artist
                </div>
                <div className="text-foreground">
                  {song.song_originalartist}
                </div>
              </div>
            )}
            {lastPlayed && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Last Time Played
                </div>
                <div className="text-foreground text-sm">
                  <Link
                    href={`/archive/setlist/${lastPlayed.show_id}`}
                    className="font-medium hover:underline pr-4"
                  >
                    {formatSetlistDate(lastPlayed.show_date)}
                  </Link>{" "}
                  <span className="text-xs">
                    (
                    {lastPlayed.showsAgo === 1
                      ? "most recent show"
                      : `${lastPlayed.showsAgo} shows ago`}
                    )
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hasGroupCounts && (
        <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
          <CardHeader className="bg-muted/60 py-2">
            <CardTitle className="text-sm font-semibold">Stats</CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-3 space-y-3">
            {stats.hasRarity && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Song Rarity
                </span>
                <span
                  className="text-xs font-normal border border-border px-1.5 py-[1px] rounded"
                  style={{
                    backgroundColor: getRarityColor(stats.rarity),
                  }}
                >
                  {stats.rarity}
                </span>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Performances by Group
              </div>
              <div className="space-y-0.5">
                {stats.groupCounts.map(({ group, count }) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => onGroupClick(group)}
                    className={`w-full px-2 py-[1px] text-left text-xs flex justify-between rounded transition-colors ${
                      selectedGroup === group
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <span>{group}</span>
                    <span className="font-medium">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSongNotes && (
        <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
          <CardHeader className="bg-muted/60 py-2">
            <CardTitle className="text-sm font-semibold">Song Notes</CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-3">
            <div
              className="text-xs leading-relaxed [&_a]:font-medium [&_a]:text-wl-orange [&_a]:hover:underline"
              dangerouslySetInnerHTML={{ __html: song.song_coachnotes ?? "" }}
            />
          </CardContent>
        </Card>
      )}

      {hasPlacementStats && (
        <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
          <CardHeader className="bg-muted/60 py-2">
            <CardTitle className="text-sm font-semibold">Set Placements</CardTitle>
          </CardHeader>
          <CardContent className="px-3 py-1.5">
            <SongPlacementPill placementStats={placementStats} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
