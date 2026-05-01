"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, type CSSProperties } from "react"

import {
  SONGS_ARCHIVE_COVER_DUAL_HOME_BG,
  SONGS_ARCHIVE_COVER_WIDE_HOME_BG,
} from "@/components/wl-home-shared"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import type {
  SongsArchiveCategory,
  SongsArchiveSong,
} from "@/hooks/use-songs-archive-data"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { cn } from "@/lib/utils"

import {
  COVER_DUAL_SECTION_CANONID,
  COVER_WIDE_SECTION_CANONID,
  type SectionKey,
} from "./songs-archive-helpers"
import {
  distributeSongsCoverEightColumns,
  partitionSongsIntoLeftRightColumns,
} from "@/components/archive-songs/songs-archive-categories-grid-math"
import { useCoverSongEightGridColumns } from "@/components/archive-songs/songs-archive-categories-grid-hooks"

function SongLinkTopic({ song }: { song: SongsArchiveSong }) {
  return (
    <Link
      href={getSongArchiveUrl(song.song_id)}
      className="topic-row"
    >
      <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug">
        <SongDisplayName
          song={song.song}
          songDisplayName={song.song_displayname}
        />
      </span>
    </Link>
  )
}

function SongLinkCover({ song }: { song: SongsArchiveSong }) {
  return (
    <Link
      href={getSongArchiveUrl(song.song_id)}
      className="songs-archive-category-tile-covers-cell"
    >
      <SongDisplayName song={song.song} songDisplayName={song.song_displayname} />
    </Link>
  )
}

function CategorySongsTwoColumns({
  songs,
  variant,
}: {
  songs: readonly SongsArchiveSong[]
  variant: "topic" | "cover"
}) {
  const [left, right] = partitionSongsIntoLeftRightColumns(songs)
  const LinkCmp = variant === "cover" ? SongLinkCover : SongLinkTopic
  return (
    <>
      <div className="songs-archive-category-tile-songs-col">
        {left.map((song) => (
          <LinkCmp key={song.song_id} song={song} />
        ))}
      </div>
      <div className="songs-archive-category-tile-songs-col">
        {right.map((song) => (
          <LinkCmp key={song.song_id} song={song} />
        ))}
      </div>
    </>
  )
}

function CategorySongsInTileGrid({
  songs,
  variant,
}: {
  songs: readonly SongsArchiveSong[]
  variant: "topic" | "cover"
}) {
  const k = songs.length
  if (k === 0) return null
  if (k === 1) {
    const LinkCmp = variant === "cover" ? SongLinkCover : SongLinkTopic
    return (
      <div className="songs-archive-category-tile-songs-col">
        <LinkCmp song={songs[0]!} />
      </div>
    )
  }
  return <CategorySongsTwoColumns songs={songs} variant={variant} />
}

export function CategoryGridBackdropFillerTile({ imageSrc }: { imageSrc: string }) {
  const style = {
    "--song-tile-accent": "#285b4e",
    "--tile-bg": `url(${JSON.stringify(imageSrc)})`,
  } as CSSProperties

  return (
    <article
      className="songs-archive-category-tile songs-archive-category-tile--has-art songs-archive-category-tile--grid-filler"
      style={style}
      aria-hidden
    />
  )
}

function CategorySongsCoversEightColGrid({
  songs,
}: {
  songs: readonly SongsArchiveSong[]
}) {
  const columnBudget = useCoverSongEightGridColumns()
  const songColumns = useMemo(
    () => distributeSongsCoverEightColumns(songs, columnBudget),
    [songs, columnBudget],
  )

  if (songs.length === 0) return null
  return (
    <div className="songs-archive-cover-eight-col-stack">
      {songColumns.map((colSongs, colIdx) => (
        <div
          key={`cover-eight-${String(colIdx)}`}
          className="songs-archive-cover-eight-column"
        >
          {colSongs.map((song) => (
            <SongLinkCover key={song.song_id} song={song} />
          ))}
        </div>
      ))}
    </div>
  )
}

function CategoryTileBody({
  category,
  songs,
  coversDenseGrid,
  useCoversEightColGrid,
}: {
  category: SongsArchiveCategory
  songs: readonly SongsArchiveSong[]
  coversDenseGrid: boolean
  useCoversEightColGrid: boolean
}) {
  const variant = coversDenseGrid ? "cover" : "topic"
  const k = songs.length
  const artThumb = category.category_artwork?.trim() ?? ""

  if (useCoversEightColGrid) {
    return (
      <div className="songs-archive-category-tile__sheet">
        <div className="widget-panel songs-archive-category-tile-widget">
          <div className="songs-archive-category-tile-song-scroll">
            <CategorySongsCoversEightColGrid songs={songs} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="songs-archive-category-tile__sheet">
      <div className="widget-panel songs-archive-category-tile-widget">
        <div className="wp-head songs-archive-category-tile__wp-head">
          <span className="songs-archive-category-tile__wp-title min-w-0 flex-1 truncate">
            {category.category}
          </span>
          {artThumb ?
            <span
              className="songs-archive-category-tile__wp-art shrink-0"
              aria-hidden
            >
              <Image
                src={artThumb}
                alt=""
                width={28}
                height={28}
                className="songs-archive-category-tile__wp-art-img block size-7 object-cover"
                unoptimized
              />
            </span>
          : null}
        </div>
        <div className="songs-archive-category-tile-song-scroll">
          <div
            className={cn(
              "songs-archive-category-tile-songs-grid",
              k === 1 && "songs-archive-category-tile-songs-grid--single-col",
            )}
          >
            <CategorySongsInTileGrid songs={songs} variant={variant} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SongsArchiveCategoryTileArticle({
  sectionKey,
  cat,
  songs,
  isDenseCoverSongSection,
  flowLayout,
}: {
  sectionKey: SectionKey
  cat: SongsArchiveCategory
  songs: readonly SongsArchiveSong[]
  isDenseCoverSongSection: boolean
  flowLayout?: boolean
}) {
  const art = cat.category_artwork?.trim() ?? ""

  let useCoversEightColGrid = false
  let coverHomeBackdrop: string | null = null
  if (!flowLayout) {
    if (
      sectionKey === "covers" &&
      cat.category_canonid === COVER_DUAL_SECTION_CANONID
    ) {
      useCoversEightColGrid = true
      coverHomeBackdrop = SONGS_ARCHIVE_COVER_DUAL_HOME_BG
    } else if (
      sectionKey === "miscCovers" &&
      cat.category_canonid === COVER_WIDE_SECTION_CANONID
    ) {
      useCoversEightColGrid = true
      coverHomeBackdrop = SONGS_ARCHIVE_COVER_WIDE_HOME_BG
    }
  }

  const backdropUrl = coverHomeBackdrop ?? (art ? art : "")
  const hasArtBackdrop = Boolean(backdropUrl)
  const style = {
    "--song-tile-accent": cat.category_color1 || "#285b4e",
    ...(hasArtBackdrop ?
      { "--tile-bg": `url(${JSON.stringify(backdropUrl)})` }
    : {}),
  } as CSSProperties

  return (
    <article
      className={cn(
        "songs-archive-category-tile",
        hasArtBackdrop && "songs-archive-category-tile--has-art",
        useCoversEightColGrid &&
          "songs-archive-category-tile--covers-span-full-row",
        flowLayout && "songs-archive-category-tile--multicol",
      )}
      style={style}
    >
      <CategoryTileBody
        category={cat}
        songs={songs}
        coversDenseGrid={isDenseCoverSongSection}
        useCoversEightColGrid={useCoversEightColGrid}
      />
    </article>
  )
}
