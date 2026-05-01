"use client"

import { useId } from "react"

import {
  HOME_BG_IMAGES,
} from "@/components/wl-home-shared"
import type {
  SongsArchiveCategory,
  SongsArchiveSong,
} from "@/hooks/use-songs-archive-data"

import {
  SECTION_ORDER,
  SECTION_TITLES,
  type SectionKey,
} from "./songs-archive-helpers"
import {
  balanceFlowSectionIntoColumns,
  orderCategoriesColumnMajor,
  trailingEmptySlotsInCategoryGrid,
} from "@/components/archive-songs/songs-archive-categories-grid-math"
import {
  CategoryGridBackdropFillerTile,
  SongsArchiveCategoryTileArticle,
} from "@/components/archive-songs/songs-archive-categories-tiles"
import { useSongsArchiveCategoryGridColumns } from "@/components/archive-songs/songs-archive-categories-grid-hooks"

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
