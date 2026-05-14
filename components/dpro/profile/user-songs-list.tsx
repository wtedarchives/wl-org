"use client"

import Image from "next/image"
import Link from "next/link"
import { Check } from "lucide-react"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { cn } from "@/lib/utils"
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
  onSongClick?: (
    songName: string,
    songDisplayName?: string | null,
    songId?: string
  ) => void
}) {
  if (sectionCategories.length === 0) return null

  const isCoverSongs = title === "Cover Songs"
  const deckClass = isCoverSongs ?
      "wl-profile-songs-category-section__deck wl-profile-songs-category-section__deck--grid"
    : "wl-profile-songs-category-section__deck wl-profile-songs-category-section__deck--columns"

  const getSongStats = (songId: string) => {
    const stat = userSongStats.find((s) => s.song_id === songId)
    return stat ? stat.count : 0
  }

  return (
    <div className="wl-profile-songs-category-section">
      <h3 className="wl-profile-songs-category-section__heading">{title}</h3>
      <div className={deckClass}>
        {sectionCategories.map((category, index) => {
          const categorySongs = songsByCategory[category.category] ?? []
          const multiCover = isCoverSongs && sectionCategories.length > 1
          const isWideCover = multiCover && (index === 0 || index === 1)
          const cardClass =
            isWideCover
              ? "wl-profile-songs-category-card wl-profile-songs-category-card--cover-span wl-profile-songs-category-card--cover-span-md"
            : "wl-profile-songs-category-card"

          return (
            <div key={category.category} className={cardClass}>
              <div className="wl-profile-songs-category-card__head">
                <p className="wl-profile-songs-category-card__title">
                  {category.category}
                </p>
                {category.category_artwork?.trim() && (
                  <span className="wl-profile-songs-category-card__art">
                    <Image
                      src={category.category_artwork}
                      alt=""
                      width={20}
                      height={20}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </span>
                )}
              </div>
              <ul
                className={
                  title === "Cover Songs"
                    ? "wl-profile-songs-category-card__list wl-profile-songs-category-card__list--grid-two"
                    : "wl-profile-songs-category-card__list"
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
                      className={cn(
                        "wl-profile-songs-song-row",
                        !seen && "wl-profile-songs-song-row--unseen",
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="wl-profile-songs-song-row__inner">
                            <span className="wl-profile-songs-song-row__name">
                              {onSongClick ?
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSongClick(
                                      song.song,
                                      song.song_displayname,
                                      song.song_id,
                                    )
                                  }
                                  className="wl-profile-songs-song-name-btn"
                                >
                                  {songNameEl}
                                </button>
                              : <Link href={getSongArchiveUrl(song.song_id)}>
                                  {songNameEl}
                                </Link>
                              }
                              {seen && (
                                <span className="wl-profile-songs-song-row__count">
                                  ({count})
                                </span>
                              )}
                            </span>
                            {seen && (
                              <Check
                                className="wl-profile-songs-song-row__check"
                                aria-hidden
                              />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <span className="text-xs">
                            {song.song_displayname?.trim() || song.song}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            </div>
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
      (song) => song.song_category === category.category,
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
    (a, b) => a.category_canonid - b.category_canonid,
  )
  const studioReleases = sortedCategories.filter((c) => c.category_canonid <= 20)
  const liveOnlySongs = sortedCategories.filter(
    (c) =>
      (c.category_canonid >= 21 && c.category_canonid <= 170) ||
      c.category_canonid === 298,
  )
  const tedTapesSongs = sortedCategories.filter(
    (c) => c.category_canonid >= 171 && c.category_canonid <= 297,
  )
  const coverSongs = sortedCategories.filter(
    (c) => c.category_canonid === 299 || c.category_canonid === 300,
  )
  const sideProjects = sortedCategories.filter((c) => c.category_canonid > 300)

  return (
    <div className="wl-profile-songs-list">
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
