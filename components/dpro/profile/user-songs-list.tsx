"use client"

import Image from "next/image"
import Link from "next/link"
import { Check } from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  UserSong,
  UserSongCategory,
  UserSongStat,
} from "@/hooks/use-user-songs-data"

function CategorySection({
  sectionCategories,
  title,
  songsByCategory,
  userSongStats,
  onSongClick,
}: {
  sectionCategories: UserSongCategory[]
  title: string
  songsByCategory: Record<string, UserSong[]>
  userSongStats: UserSongStat[]
  onSongClick?: (songName: string, songDisplayName?: string | null, songId?: string) => void
}) {
  if (sectionCategories.length === 0) return null

  const isCoverSongs = title === "Cover Songs"
  const containerClass = isCoverSongs
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 4col:grid-cols-4 gap-4 items-start"
    : "columns-1 gap-x-4 md:columns-2 lg:columns-3 4col:columns-4 space-y-4"

  const getSongStats = (songId: string) => {
    const stat = userSongStats.find((s) => s.song_id === songId)
    return stat ? stat.count : 0
  }

  return (
    <div className="mb-8 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className={containerClass}>
        {sectionCategories.map((category, index) => {
          const categorySongs = songsByCategory[category.category] ?? []
          const isFirstCoverCard =
            isCoverSongs && sectionCategories.length > 1 && index === 0
          const isSecondCoverCard =
            isCoverSongs && sectionCategories.length > 1 && index === 1
          const cardClass = isFirstCoverCard
            ? "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0"
            : isSecondCoverCard
              ? "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0"
              : "overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0 break-inside-avoid"

          return (
            <Card key={category.category} className={cardClass}>
              <div className="bg-muted/60 px-4 py-2 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium truncate pr-2">
                  {category.category}
                </CardTitle>
                {category.category_artwork?.trim() && (
                  <span className="shrink-0 size-5 relative rounded overflow-hidden border border-border">
                    <Image
                      src={category.category_artwork}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 object-cover"
                      unoptimized
                    />
                  </span>
                )}
              </div>
              <CardContent className="p-0">
                <ul
                  className={
                    title === "Cover Songs"
                      ? "grid grid-cols-1 sm:grid-cols-2 gap-0"
                      : ""
                  }
                >
                  {categorySongs.map((song) => {
                    const count = getSongStats(song.song_id)
                    const seen = count > 0
                    const songNameEl = (
                      <SongDisplayName
                        song={song.song}
                        songDisplayName={song.song_displayname}
                      />
                    )
                    return (
                      <li
                        key={song.song_id}
                        className="border-t border-border/40 bg-background/70 hover:bg-muted/40 transition-colors"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between gap-2 py-0.5 pl-3 pr-3 text-xs font-medium text-foreground">
                              <span className="min-w-0 flex-1">
                                {onSongClick ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSongClick(
                                        song.song,
                                        song.song_displayname,
                                        song.song_id
                                      )
                                    }
                                    className="text-left underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-muted-foreground/50 rounded"
                                  >
                                    {songNameEl}
                                  </button>
                                ) : (
                                  <Link
                                    href={`/archive/song/${song.song_id}`}
                                    className="underline-offset-4 hover:underline"
                                  >
                                    {songNameEl}
                                  </Link>
                                )}
                                {seen && (
                                  <span className="ml-2 font-normal text-wl-orange">
                                    ({count})
                                  </span>
                                )}
                              </span>
                              {seen && (
                                <Check className="size-3.5 shrink-0 text-wl-green" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span className="text-xs">{song.song}</span>
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export interface UserSongsListProps {
  categories: UserSongCategory[]
  songs: UserSong[]
  userSongStats: UserSongStat[]
  onSongClick?: (
    songName: string,
    songDisplayName?: string | null,
    songId?: string
  ) => void
}

export function UserSongsList({
  categories,
  songs,
  userSongStats,
  onSongClick,
}: UserSongsListProps) {
  const songsByCategory: Record<string, UserSong[]> = {}
  categories.forEach((category) => {
    const categorySongs = songs.filter(
      (song) => song.song_category === category.category
    )
    const sorted = [...categorySongs].sort((a, b) => {
      if (a.song_categoryorder !== b.song_categoryorder) {
        return a.song_categoryorder - b.song_categoryorder
      }
      return a.song.localeCompare(b.song)
    })
    songsByCategory[category.category] = sorted
  })

  const sortedCategories = [...categories].sort(
    (a, b) => a.category_canonid - b.category_canonid
  )
  const studioReleases = sortedCategories.filter((c) => c.category_canonid <= 20)
  const liveOnlySongs = sortedCategories.filter(
    (c) =>
      (c.category_canonid >= 21 && c.category_canonid <= 170) ||
      c.category_canonid === 298
  )
  const tedTapesSongs = sortedCategories.filter(
    (c) => c.category_canonid >= 171 && c.category_canonid <= 297
  )
  const coverSongs = sortedCategories.filter(
    (c) => c.category_canonid === 299 || c.category_canonid === 300
  )
  const sideProjects = sortedCategories.filter((c) => c.category_canonid > 300)

  return (
    <div className="pb-8 w-full">
      <CategorySection
        sectionCategories={studioReleases}
        title="Studio Releases"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        onSongClick={onSongClick}
      />
      <CategorySection
        sectionCategories={liveOnlySongs}
        title="Live-Only Songs"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        onSongClick={onSongClick}
      />
      <CategorySection
        sectionCategories={tedTapesSongs}
        title="Ted Tapes Songs/Jams"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        onSongClick={onSongClick}
      />
      <CategorySection
        sectionCategories={coverSongs}
        title="Cover Songs"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        onSongClick={onSongClick}
      />
      <CategorySection
        sectionCategories={sideProjects}
        title="Side Projects"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        onSongClick={onSongClick}
      />
    </div>
  )
}
