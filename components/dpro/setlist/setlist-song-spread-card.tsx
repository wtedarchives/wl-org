"use client"

import Image from "next/image"
import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCategoryArtwork } from "@/hooks/use-category-artwork"
import type { SetlistEntry } from "@/types/setlist"

const EXCLUDED_SHORTS = ["aborted", "fake", "reprise", "tease"]
const COVER_CATEGORIES = ["Cover Songs", "Miscellaneous Covers"]

interface SetlistSongSpreadCardProps {
  setlist: SetlistEntry[]
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
}

interface CategorySpread {
  category: string
  count: number
  canonid: number
  songs: string[]
}

function CategorySpreadRow({
  category,
  count,
  songs,
  maxCount,
  isHovered,
  onCategoryHover,
  tooltipContent,
}: {
  category: string
  count: number
  songs: string[]
  maxCount: number
  isHovered: boolean
  onCategoryHover?: (category: string | null) => void
  tooltipContent: React.ReactNode
}) {
  const { artwork, loaded } = useCategoryArtwork(category)
  const barWidth = maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 0

  const rowContent = (
    <div
      className={`flex items-center gap-2 tabular-nums ${
        isHovered ? "bg-muted/80 rounded px-1 -mx-1" : ""
      } ${onCategoryHover ? "cursor-default" : ""}`}
      onMouseEnter={() => onCategoryHover?.(category)}
      onMouseLeave={() => onCategoryHover?.(null)}
    >
      <span className="shrink-0 size-6 flex items-center justify-center rounded-sm overflow-hidden bg-muted">
        {loaded && artwork ? (
          <Image
            src={artwork}
            alt={category}
            width={24}
            height={24}
            className="size-6 object-cover"
            unoptimized
            onError={(e) => {
              const el = e.target as HTMLImageElement
              if (el) el.style.display = "none"
            }}
          />
        ) : (
          <span className="text-[10px] text-muted-foreground truncate px-0.5" title={category}>
            {category.slice(0, 2)}
          </span>
        )}
      </span>
      <div
        className="h-4 flex-1 min-w-0 rounded-full bg-muted overflow-hidden"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-wl-orange/60 transition-all duration-200"
          style={{
            width: `${barWidth}%`,
            opacity: isHovered ? 1 : 0.8,
          }}
        />
      </div>
      <span className="text-muted-foreground shrink-0 text-right">
        {count}
      </span>
    </div>
  )

  return (
    <li>
      {tooltipContent ? (
        <Tooltip>
          <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs text-[11px] p-0">
            <div className="w-full border-b border-black">
              <p className="font-bold px-3 py-1 leading-tight text-sm">{category}</p>
            </div>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      ) : (
        rowContent
      )}
    </li>
  )
}

export function SetlistSongSpreadCard({
  setlist,
  hoveredCategory = null,
  onCategoryHover,
}: SetlistSongSpreadCardProps) {
  const spread = useMemo((): CategorySpread[] => {
    const filteredSetlist = setlist.filter((entry) => {
      const short = (entry.entry_short ?? "").toLowerCase().trim()
      return !EXCLUDED_SHORTS.includes(short)
    })

    const counts: Record<string, number> = {}
    const songsByCategory: Record<string, string[]> = {}
    const canonids: Record<string, number> = {}
    const seenSongs = new Set<string>()

    for (const entry of filteredSetlist) {
      const category = entry.songs?.song_category ?? "undefined"
      const songKey = entry.entry_song

      if (seenSongs.has(songKey)) continue

      seenSongs.add(songKey)
      counts[category] = (counts[category] ?? 0) + 1

      if (!songsByCategory[category]) {
        songsByCategory[category] = []
        canonids[category] = entry.category_canonid ?? 0
      }
      const rawArtist = entry.songs?.song_originalartist?.trim()
      const artist =
        rawArtist === "[Traditional]" ? "Traditional" : rawArtist
      const showArtist = COVER_CATEGORIES.includes(category) && artist
      const label = showArtist ? `${songKey} [${artist}]` : songKey
      songsByCategory[category].push(label)
    }

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        canonid: canonids[category] ?? 0,
        songs: songsByCategory[category] ?? [],
      }))
      .sort((a, b) => b.count - a.count || a.canonid - b.canonid)
  }, [setlist])

  const maxCount = spread.length > 0 ? Math.max(...spread.map((s) => s.count)) : 0

  if (spread.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardContent className="p-3">
          <p className="text-xs font-medium text-foreground">Song Spread</p>
          <p className="text-xs text-muted-foreground mt-1">No data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-foreground mb-2">Song Spread</p>
        <ul className="space-y-1 text-xs">
          {spread.map(({ category, count, songs }) => {
            const tooltipContent =
              songs.length > 0 ? (
                <ul className="list-none space-y-[1px] overflow-y-auto text-[11px] leading-tight py-1.5">
                  {songs.map((s) => {
                    const bracketIdx = s.indexOf(" [")
                    const songName = bracketIdx >= 0 ? s.slice(0, bracketIdx) : s
                    const artistPart = bracketIdx >= 0 ? s.slice(bracketIdx) : null
                    return (
                      <li key={s} className="px-3">
                        <span className="font-semibold">{songName}</span>
                        {artistPart && (
                          <span className="font-normal">{artistPart}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : null
            return (
              <CategorySpreadRow
                key={category}
                category={category}
                count={count}
                songs={songs}
                maxCount={maxCount}
                isHovered={hoveredCategory === category}
                onCategoryHover={onCategoryHover}
                tooltipContent={tooltipContent}
              />
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
