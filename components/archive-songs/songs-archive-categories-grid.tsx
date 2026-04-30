"use client"

import Image from "next/image"
import Link from "next/link"
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
} from "react"

import {
  HOME_BG_IMAGES,
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
  SECTION_ORDER,
  SECTION_TITLES,
  type SectionKey,
} from "./songs-archive-helpers"

function tilesColumnCountForViewportWidth(width: number): number {
  if (width > 1986) return 5
  if (width > 1589) return 4
  if (width > 1191) return 3
  if (width > 794) return 2
  return 1
}

/** Inner song columns for Cover Songs / Miscellaneous Covers (`>` thresholds → 2…8 cols). */
function coversSongGridColumnCountForViewport(width: number): number {
  if (width > 1780) return 8
  if (width > 1520) return 7
  if (width > 1270) return 6
  if (width > 1020) return 5
  if (width > 770) return 4
  if (width > 510) return 3
  if (width > 270) return 2
  return 1
}

/**
 * Partition songs into balanced vertical columns (↑ then →), so CSS can render
 * them as stacked flex cols without syncing row heights across the row.
 */
function distributeSongsCoverEightColumns<T>(
  items: readonly T[],
  responsiveColumnBudget: number,
): readonly (readonly T[])[] {
  const n = items.length
  if (n === 0) return []

  const C = Math.min(responsiveColumnBudget, n)
  const base = Math.floor(n / C)
  const rem = n % C
  let off = 0
  const out: T[][] = []
  for (let col = 0; col < C; col++) {
    const h = base + (col < rem ? 1 : 0)
    out.push(items.slice(off, off + h))
    off += h
  }
  return out
}

function useCoverSongEightGridColumns(): number {
  const [cols, setCols] = useState(1)

  useEffect(() => {
    function read() {
      setCols(coversSongGridColumnCountForViewport(window.innerWidth))
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])

  return cols
}

/** Empty cells in last row only (aligned with `.songs-archive-category-tiles-grid` breakpoints). */
function trailingEmptySlotsInCategoryGrid(itemCount: number, columnCount: number): number {
  if (columnCount <= 0) return 0
  const r = itemCount % columnCount
  return r === 0 ? 0 : columnCount - r
}

/**
 * Dom order row-major (`grid-auto-flow: row`) so visuals read column-first ↓→
 * like   1 6 11   vs default   1 2 3
 *        2 7 …            4 5 6
 */
function orderCategoriesColumnMajor<T>(
  items: readonly T[],
  columnCount: number,
): T[] {
  const n = items.length
  if (n <= 1 || columnCount <= 1) return [...items]
  const C = columnCount
  const base = Math.floor(n / C)
  const rem = n % C
  const heights = Array.from({ length: C }, (_, col) =>
    base + (col < rem ? 1 : 0),
  )
  const R = Math.max(...heights)
  const prefixByCol = new Array(C + 1).fill(0)
  for (let col = 0; col < C; col++) {
    prefixByCol[col + 1] = prefixByCol[col] + heights[col]
  }
  const out: T[] = []
  for (let row = 0; row < R; row++) {
    for (let col = 0; col < C; col++) {
      if (row >= heights[col]) continue
      out.push(items[prefixByCol[col] + row])
    }
  }
  return out
}

/** Balance items into `columnCount` vertical stacks (1–5 from `tilesColumnCountForViewportWidth`). */

function balanceFlowSectionIntoColumns<T>(
  items: readonly T[],
  columnCount: number,
): T[][] {
  const C = Math.max(1, columnCount)
  const cols: T[][] = Array.from({ length: C }, () => [])
  const n = items.length
  if (n === 0) return cols

  const base = Math.floor(n / C)
  const rem = n % C
  let idx = 0
  for (let col = 0; col < C; col++) {
    const h = base + (col < rem ? 1 : 0)
    for (let j = 0; j < h && idx < n; j++) {
      cols[col].push(items[idx]!)
      idx += 1
    }
  }
  return cols
}

function useSongsArchiveCategoryGridColumns(): { cols: number; hydrated: boolean } {
  const [hydrated, setHydrated] = useState(false)
  const [cols, setCols] = useState(1)

  useEffect(() => {
    setHydrated(true)
    function read() {
      setCols(tilesColumnCountForViewportWidth(window.innerWidth))
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])

  return { cols, hydrated }
}

function partitionSongsIntoLeftRightColumns<T>(
  items: readonly T[],
): readonly [readonly T[], readonly T[]] {
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}

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

/** Per tile: one column when a single song; balanced two columns when there are 2+. */
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

function CategoryGridBackdropFillerTile({ imageSrc }: { imageSrc: string }) {
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

function SongsArchiveCategoryTileArticle({
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

export function SongsArchiveCategoriesGrid({
  categoriesBySection,
  songsByCategory,
}: {
  categoriesBySection: Record<SectionKey, SongsArchiveCategory[]>
  songsByCategory: Record<string, SongsArchiveSong[]>
}) {
  const reactId = useId()
  const { cols: gridColumnCount, hydrated: gridColumnsHydrated } =
    useSongsArchiveCategoryGridColumns()

  return (
    <>
      {SECTION_ORDER.map((key, sectionIndex) => {
        const sectionCats = categoriesBySection[key]
        if (sectionCats.length === 0) return null

        const title = SECTION_TITLES[key]
        const isDenseCoverSongSection =
          key === "covers" || key === "miscCovers"
        const usesLegacyMulticolLayout =
          key === "studio" ||
          key === "live" ||
          key === "ted" ||
          key === "side"
        const headingId = `${reactId}-${key}`
        const fillerCount =
          gridColumnsHydrated ?
            key === "covers" ||
            key === "miscCovers" ||
            usesLegacyMulticolLayout ?
              0
            : trailingEmptySlotsInCategoryGrid(
                sectionCats.length,
                gridColumnCount,
              )
          : 0
        const tilesForGrid =
          key === "covers" || key === "miscCovers" || usesLegacyMulticolLayout ?
            [...sectionCats]
          : orderCategoriesColumnMajor(sectionCats, gridColumnCount)

        return (
          <section
            key={key}
            aria-labelledby={headingId}
            className="wl-home-v2-songs-archive-section mb-10 last:mb-0"
          >
            <h2
              id={headingId}
              className="sc-label wl-home-v2-songs-archive-section-heading"
            >
              {title}
            </h2>

            <div
              className={
                usesLegacyMulticolLayout ?
                  "songs-archive-category-tiles-multicol"
                : "songs-archive-category-tiles-grid"
              }
            >
              {usesLegacyMulticolLayout ?
                balanceFlowSectionIntoColumns(
                  tilesForGrid,
                  gridColumnCount,
                ).map((colCats, colIdx) => (
                  <div
                    key={`${key}-flow-col-${String(colIdx)}`}
                    className="songs-archive-category-tiles-multicol__col"
                  >
                    {colCats.map((cat) => {
                      const songs = songsByCategory[cat.category] ?? []
                      return (
                        <SongsArchiveCategoryTileArticle
                          key={cat.category}
                          sectionKey={key}
                          cat={cat}
                          songs={songs}
                          isDenseCoverSongSection={isDenseCoverSongSection}
                          flowLayout
                        />
                      )
                    })}
                  </div>
                ))
              : tilesForGrid.map((cat) => (
                  <SongsArchiveCategoryTileArticle
                    key={cat.category}
                    sectionKey={key}
                    cat={cat}
                    songs={songsByCategory[cat.category] ?? []}
                    isDenseCoverSongSection={isDenseCoverSongSection}
                  />
                ))}
              {fillerCount > 0 ?
                Array.from({ length: fillerCount }, (_, i) => {
                  const bg =
                    HOME_BG_IMAGES[
                      (sectionIndex * 31 + sectionCats.length + i) %
                        HOME_BG_IMAGES.length
                    ]
                  return (
                    <CategoryGridBackdropFillerTile
                      key={`${String(key)}-grid-filler-${i}`}
                      imageSrc={bg}
                    />
                  )
                })
              : null}
            </div>
          </section>
        )
      })}
    </>
  )
}
