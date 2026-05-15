"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import { useId } from "react"

import {
  CategoryCompleteRotatingArtwork,
  DripfieldRotatingArtwork,
} from "@/components/dpro/rotating-bandcamp-artwork"
import { HOME_BG_IMAGES } from "@/components/wl-home-shared"
import { cn } from "@/lib/utils"
import { getListArchiveUrl } from "@/lib/list-archive-url"
import type { List } from "@/hooks/use-lists-data"

function listIdToBackdropIndex(listId: string): number {
  let h = 0
  for (let i = 0; i < listId.length; i++) {
    h = (h * 31 + listId.charCodeAt(i)) >>> 0
  }
  return h % HOME_BG_IMAGES.length
}

function ListTypeArtwork({
  listType,
  className,
}: {
  listType: string | null
  className?: string
}) {
  if (listType === "dripfield_complete") {
    return (
      <DripfieldRotatingArtwork
        className={cn("size-7 shrink-0 border border-[rgb(49,51,49)]", className)}
        imageSizes="28px"
      />
    )
  }
  if (listType === "category_complete") {
    return (
      <CategoryCompleteRotatingArtwork
        className={cn("size-7 shrink-0 border border-[rgb(49,51,49)]", className)}
        imageSizes="28px"
      />
    )
  }
  return null
}

function ListsArchiveListTile({ list }: { list: List }) {
  const backdropUrl = HOME_BG_IMAGES[listIdToBackdropIndex(list.list_id)]
  const style = {
    "--song-tile-accent": "#285b4e",
    "--tile-bg": `url(${JSON.stringify(backdropUrl)})`,
  } as CSSProperties
  const desc = list.list_description?.trim() ?? ""

  return (
    <Link
      href={getListArchiveUrl(list.list_id)}
      className={cn(
        "block min-h-0 min-w-0 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--wl-light-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
      )}
    >
      <article
        className="lists-archive-list-tile songs-archive-category-tile songs-archive-category-tile--has-art h-full"
        style={style}
      >
        <div className="songs-archive-category-tile__sheet">
          <div className="widget-panel songs-archive-category-tile-widget">
            <div className="wp-head songs-archive-category-tile__wp-head">
              <span className="songs-archive-category-tile__wp-title min-w-0 flex-1 text-left leading-snug">
                {list.list_name}
              </span>
              <ListTypeArtwork listType={list.list_type} className="shrink-0" />
            </div>
            <div className="songs-archive-category-tile-song-scroll">
              {desc ?
                <p className="px-3 pb-3 pt-0 text-left text-[12px] leading-snug text-white/70">
                  {desc}
                </p>
              : <div className="px-3 pb-3 pt-0 text-[12px] text-white/40">
                  Open list
                </div>
              }
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

function ListsArchiveSection({
  title,
  lists,
  emptyMessage,
  sectionKey,
}: {
  title: string
  lists: List[]
  emptyMessage: string
  sectionKey: string
}) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="wl-home-v2-songs-archive-section mb-10 last:mb-0"
    >
      <h2
        id={headingId}
        className="sc-label wl-home-v2-songs-archive-section-heading"
      >
        {title}
      </h2>
      {lists.length > 0 ?
        <div className="songs-archive-category-tiles-grid">
          {lists.map((list) => (
            <ListsArchiveListTile key={`${sectionKey}-${list.list_id}`} list={list} />
          ))}
        </div>
      : <div className="songs-archive-category-tiles-grid">
          <article className="lists-archive-list-tile songs-archive-category-tile">
            <div className="songs-archive-category-tile__sheet">
              <div className="widget-panel songs-archive-category-tile-widget">
                <div className="songs-archive-category-tile-song-scroll">
                  <p className="px-3 py-4 text-center text-[12px] text-white/50">
                    {emptyMessage}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      }
    </section>
  )
}

const LISTS_ARCHIVE_INDEX_PAGE_BG = HOME_BG_IMAGES[0]

export function ListsArchiveIndexTiles({
  songLists,
  showLists,
}: {
  songLists: List[]
  showLists: List[]
}) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-[0.08] grayscale"
        style={
          {
            backgroundImage: `url(${JSON.stringify(LISTS_ARCHIVE_INDEX_PAGE_BG)})`,
          } as CSSProperties
        }
      />
      <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">
        <ListsArchiveSection
          title="Songs"
          lists={songLists}
          emptyMessage="No song lists available"
          sectionKey="songs"
        />
        <ListsArchiveSection
          title="Shows"
          lists={showLists}
          emptyMessage="No show lists available"
          sectionKey="shows"
        />
      </div>
    </div>
  )
}
