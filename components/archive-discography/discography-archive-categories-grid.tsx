"use client"

import Link from "next/link"
import Image from "next/image"
import { useId, type CSSProperties } from "react"

import { HOME_BG_IMAGES } from "@/components/wl-home-shared"
import { balanceFlowSectionIntoColumns } from "@/components/archive-songs/songs-archive-categories-grid-math"
import { useSongsArchiveCategoryGridColumns } from "@/components/archive-songs/songs-archive-categories-grid-hooks"
import {
  type DiscographyArchiveIndexRow,
  discographyRowLinkLabel,
} from "@/lib/discography-archive-index"
import { DISCOGRAPHY_PUBLIC_CATEGORIES } from "@/lib/discography-public"
import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import { cn } from "@/lib/utils"

function DiscographyCategoryTileArticle({
  category,
  rows,
}: {
  category: string
  rows: readonly DiscographyArchiveIndexRow[]
}) {
  const k = rows.length
  const catIndex = DISCOGRAPHY_PUBLIC_CATEGORIES.indexOf(
    category as (typeof DISCOGRAPHY_PUBLIC_CATEGORIES)[number],
  )
  const backdropUrl =
    HOME_BG_IMAGES[(catIndex >= 0 ? catIndex : 0) % HOME_BG_IMAGES.length]
  const tileStyle = {
    "--song-tile-accent": "#285b4e",
    "--tile-bg": `url(${JSON.stringify(backdropUrl)})`,
  } as CSSProperties

  return (
    <article
      className="songs-archive-category-tile songs-archive-category-tile--has-art"
      style={tileStyle}
    >
      <div className="songs-archive-category-tile__sheet">
        <div className="widget-panel songs-archive-category-tile-widget">
          <div className="wp-head songs-archive-category-tile__wp-head">
            <span className="songs-archive-category-tile__wp-title min-w-0 flex-1 truncate">
              {category}
            </span>
          </div>
          <div className="songs-archive-category-tile-song-scroll">
            <div
              className={cn(
                "songs-archive-category-tile-songs-grid",
                "songs-archive-category-tile-songs-grid--single-col",
              )}
            >
              {k === 0 ?
                <div className="songs-archive-category-tile-songs-col px-3 py-4 text-center text-[12px] text-white/50">
                  No items found
                </div>
              : rows.map((item) => (
                  <Link
                    key={item.uuid}
                    href={getDiscographyArchiveUrl(item.uuid)}
                    className="topic-row flex min-w-0 items-center justify-between gap-2"
                  >
                    <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug">
                      {discographyRowLinkLabel(item, category)}
                    </span>
                    {item.artwork ?
                      <Image
                        src={item.artwork}
                        alt=""
                        width={20}
                        height={20}
                        className="block size-5 shrink-0 rounded border border-[rgb(49,51,49)] object-contain"
                        unoptimized
                        onError={(e) => {
                          const el = e.currentTarget
                          el.style.display = "none"
                        }}
                      />
                    : null}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function DiscographyArchiveCategoriesGrid({
  byCategory,
}: {
  byCategory: Map<string, DiscographyArchiveIndexRow[]>
}) {
  const headingId = useId()
  const gridColumnCount = useSongsArchiveCategoryGridColumns()
  const categories = [...DISCOGRAPHY_PUBLIC_CATEGORIES]
  const columns = balanceFlowSectionIntoColumns(categories, gridColumnCount)

  const tilesBackdropStyle = {
    "--discography-tiles-backdrop-bg": `url(${JSON.stringify(HOME_BG_IMAGES[0])})`,
  } as CSSProperties

  return (
    <section
      aria-labelledby={headingId}
      className="wl-home-v2-songs-archive-section mb-10 flex min-h-0 flex-1 flex-col last:mb-0"
    >
      <h2
        id={headingId}
        className="sc-label wl-home-v2-songs-archive-section-heading"
      >
        Discography
      </h2>
      <div
        className={cn(
          "songs-archive-category-tiles-multicol discography-archive-category-tiles-multicol discography-archive-tiles-backdrop",
          "min-h-0 flex-1",
        )}
        style={tilesBackdropStyle}
      >
        {columns.map((colCats, colIdx) => (
          <div
            key={`discography-flow-col-${String(colIdx)}`}
            className="songs-archive-category-tiles-multicol__col"
          >
            {colCats.map((category) => (
              <DiscographyCategoryTileArticle
                key={category}
                category={category}
                rows={byCategory.get(category) ?? []}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
