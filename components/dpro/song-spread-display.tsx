"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCategoryArtwork } from "@/hooks/use-category-artwork"
import { isSongSpreadCoverCategory } from "@/components/dpro/setlist/display-setlist-table.constants"
import { cn } from "@/lib/utils"

export interface CategorySpread {
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
  showTooltips,
  tooltipSide = "left",
  variant = "card",
  v2UseProportionalBar = false,
}: {
  category: string
  count: number
  songs: string[]
  maxCount: number
  isHovered: boolean
  onCategoryHover?: (category: string | null) => void
  tooltipContent: React.ReactNode
  showTooltips: boolean
  tooltipSide?: "left" | "right" | "top" | "bottom"
  variant?: "card" | "wl-home-v2-setlist"
  /** WL Home v2: one teal bar (`count/maxCount`) instead of N segments when max count is huge. */
  v2UseProportionalBar?: boolean
}) {
  const { artwork, loaded } = useCategoryArtwork(category)
  const barWidth = maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 0
  const isV2 = variant === "wl-home-v2-setlist"
  const filledSegments = Math.min(count, maxCount)

  const rowContent = (
    <div
      className={cn(
        "flex items-center gap-2 tabular-nums",
        !isV2 && isHovered && "bg-muted/80 rounded px-1 -mx-1",
        isV2 &&
          cn(
            "wl-home-v2-setlist-song-spread-row rounded-md px-0.5 -mx-0.5",
            isHovered && "wl-home-v2-setlist-song-spread-row--hover",
          ),
        onCategoryHover ? "cursor-default" : "",
      )}
      onMouseEnter={() => onCategoryHover?.(category)}
      onMouseLeave={() => onCategoryHover?.(null)}
    >
      <span
        className={cn(
          "shrink-0 size-6 flex items-center justify-center rounded-sm overflow-hidden",
          isV2 ? "wl-home-v2-setlist-song-spread-icon" : "bg-muted",
        )}
      >
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
          <span
            className={cn(
              "truncate px-0.5 text-[10px]",
              isV2 ?
                "text-white/55"
              : "text-muted-foreground",
            )}
            {...(showTooltips && { title: category })}
          >
            {category.slice(0, 2)}
          </span>
        )}
      </span>
      {isV2 && maxCount > 0 ?
        v2UseProportionalBar ?
          <div
            className="wl-home-v2-setlist-song-spread-track wl-home-v2-setlist-song-spread-track--proportion flex-1 min-w-0 min-h-5 flex items-center justify-start"
            aria-hidden
          >
            <div
              className="wl-home-v2-setlist-song-spread-proportion-fill"
              style={{
                width: `${barWidth}%`,
              }}
            />
          </div>
        : <div
            className="wl-home-v2-setlist-song-spread-track wl-home-v2-setlist-song-spread-track--segmented flex-1 min-w-0 min-h-5"
            aria-hidden
          >
            {Array.from({ length: maxCount }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "wl-home-v2-setlist-song-spread-segment",
                  i < filledSegments &&
                    "wl-home-v2-setlist-song-spread-segment--filled",
                  isHovered &&
                    i < filledSegments &&
                    "wl-home-v2-setlist-song-spread-segment--filled-hover",
                )}
              />
            ))}
          </div>
      : <div
          className={cn(
            "h-4 flex-1 min-w-0 rounded-full overflow-hidden",
            "bg-muted",
          )}
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
      }
      <span
        className={cn(
          "shrink-0 text-right tabular-nums",
          isV2 ?
            "wl-home-v2-setlist-song-spread-count inline-block text-[13px] text-white/55"
          : "text-muted-foreground",
        )}
        style={
          isV2 && maxCount >= 10 ?
            { minWidth: `${String(maxCount).length}ch` }
          : undefined
        }
      >
        {count}
      </span>
    </div>
  )

  const tooltipBody =
    isV2 ?
      <div className="wl-home-v2-setlist-song-spread-tooltip-inner text-left">
        <p className="wl-home-v2-setlist-song-spread-tooltip-title">{category}</p>
        {tooltipContent}
      </div>
    : <>
        <div className="w-full border-b border-black">
          <p className="font-bold px-3 py-1 leading-tight text-sm">{category}</p>
        </div>
        {tooltipContent}
      </>

  return (
    <li>
      {showTooltips && tooltipContent ? (
        <Tooltip>
          <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
          <TooltipContent
            side={tooltipSide}
            sideOffset={6}
            className={cn(
              "max-w-xs p-0",
              isV2 ? "setlist-header-tooltip" : "text-[11px]",
            )}
          >
            {tooltipBody}
          </TooltipContent>
        </Tooltip>
      ) : (
        rowContent
      )}
    </li>
  )
}

interface SongSpreadDisplayProps {
  spread: CategorySpread[]
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
  /** Max height for the entire card, e.g. "max-h-[400px]" */
  cardMaxHeight?: string
  /** Tooltip position; default "left". Use "top" for venue song spread. */
  tooltipSide?: "left" | "right" | "top" | "bottom"
  /**
   * `wl-home-v2-setlist`: no shadcn Card — list only for embedding in WL Home v2 setlist aside.
   */
  variant?: "card" | "wl-home-v2-setlist"
  /**
   * Tour song spread tooltips include a trailing `[n]` show count — add space before that segment only.
   * Set by {@link TourSongSpread}; does not apply to setlist/venue spreads.
   */
  tooltipPadTourTrailingPlayCount?: boolean
  /**
   * When set (with `wl-home-v2-setlist`), rows use one proportional meter if the
   * largest category count exceeds this value (avoid 26+ segment cells). Intended for tour spread only.
   */
  v2ProportionalBarWhenMaxCountExceeds?: number
}

function getSongNameForSort(s: string): string {
  const bracketIdx = s.indexOf(" [")
  return bracketIdx >= 0 ? s.slice(0, bracketIdx) : s
}

/** Tour spreads append ` [\d]` per-show counts (`computeTourSongSpreadFromShows`). */
function stripTrailingTourPlayBracketCount(raw: string): {
  body: string
  count: string | null
} {
  const m = /\s*\[(\d+)\]$/.exec(raw)
  if (!m) return { body: raw, count: null }
  return {
    body: raw.slice(0, m.index),
    count: `[${m[1]}]`,
  }
}

export function SongSpreadDisplay({
  spread,
  hoveredCategory = null,
  onCategoryHover,
  cardMaxHeight,
  tooltipSide = "left",
  variant = "card",
  tooltipPadTourTrailingPlayCount = false,
  v2ProportionalBarWhenMaxCountExceeds,
}: SongSpreadDisplayProps) {
  const isDesktop = useIsDesktopContentLayout()
  const maxCount = spread.length > 0 ? Math.max(...spread.map((s) => s.count)) : 0
  const isV2 = variant === "wl-home-v2-setlist"
  const v2UseProportionalBar =
    Boolean(
      isV2 &&
        v2ProportionalBarWhenMaxCountExceeds != null &&
        maxCount > v2ProportionalBarWhenMaxCountExceeds,
    )

  if (spread.length === 0) return null

  const cardClassName = cardMaxHeight
    ? `ring-0 border border-border/60 bg-card/80 overflow-hidden py-0 ${cardMaxHeight} flex flex-col`
    : "ring-0 border border-border/60 bg-card/80 overflow-hidden py-0"

  const contentClassName = cardMaxHeight
    ? "p-0 flex-1 min-h-0 overflow-y-auto"
    : "p-0"

  const ulClassName = cardMaxHeight
    ? "space-y-1 text-xs p-3"
    : "space-y-1 text-xs max-h-[390px] md:max-h-[498px] overflow-y-auto p-3"

  const list = (
    <ul
      className={cn(
        "space-y-1 text-xs",
        isV2 ?
          "wl-home-v2-setlist-song-spread-ul max-h-[min(420px,55vh)] overflow-y-auto py-0.5"
        : ulClassName,
      )}
    >
      {spread.map(({ category, count, songs }) => {
        const songsSortedByName = [...songs].sort((a, b) =>
          getSongNameForSort(a).localeCompare(getSongNameForSort(b)),
        )
        const coverCategoryTooltip = isSongSpreadCoverCategory(category)
        const tooltipContent =
          songsSortedByName.length > 0 ?
            <ul
              className={cn(
                "list-none space-y-0.5 overflow-y-auto leading-tight",
                isV2 ?
                  "wl-home-v2-setlist-song-spread-tooltip-songs max-h-[min(280px,40vh)] py-1 text-[12px] text-white/88"
                : "space-y-[1px] py-1.5 text-[11px]",
                !isV2 && "px-3",
              )}
            >
              {songsSortedByName.map((s) => {
                const { body: lineForTitle, count: trailingPlayCount } =
                  tooltipPadTourTrailingPlayCount ?
                    stripTrailingTourPlayBracketCount(s)
                  : { body: s, count: null as string | null }

                const bracketIdx = lineForTitle.indexOf(" [")
                const songName =
                  bracketIdx >= 0 ?
                    lineForTitle.slice(0, bracketIdx)
                  : lineForTitle
                const artistPart =
                  bracketIdx >= 0 ? lineForTitle.slice(bracketIdx) : null
                const artistGap =
                  coverCategoryTooltip && artistPart != null && artistPart !== ""
                return (
                  <li
                    key={s}
                    className={cn(!isV2 && "px-3", isV2 && "px-0")}
                  >
                    <span className="font-semibold">{songName}</span>
                    {artistPart ?
                      <span
                        className={cn(
                          "font-normal",
                          isV2 && "text-white/75",
                          artistGap &&
                            (isV2 ?
                              "wl-home-v2-setlist-song-spread-tooltip-artist-gap"
                            : "ml-2.5"),
                        )}
                      >
                        {artistPart}
                      </span>
                    : null}
                    {trailingPlayCount ?
                      <span
                        className={cn(
                          "pl-2 font-semibold tabular-nums",
                          isV2 ? "text-white/72" : "text-muted-foreground",
                        )}
                      >
                        {trailingPlayCount}
                      </span>
                    : null}
                  </li>
                )
              })}
            </ul>
          : null
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
            showTooltips={isDesktop}
            tooltipSide={tooltipSide}
            variant={variant}
            v2UseProportionalBar={v2UseProportionalBar}
          />
        )
      })}
    </ul>
  )

  if (isV2) {
    return list
  }

  return (
    <Card className={cardClassName}>
      <CardHeader className="shrink-0 bg-muted/60 py-2">
        <CardTitle>Song Spread</CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>{list}</CardContent>
    </Card>
  )
}

