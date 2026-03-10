"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCategoryArtwork } from "@/hooks/use-category-artwork"

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
          <span
            className="text-[10px] text-muted-foreground truncate px-0.5"
            {...(showTooltips && { title: category })}
          >
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
      {showTooltips && tooltipContent ? (
        <Tooltip>
          <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
          <TooltipContent side={tooltipSide} className="max-w-xs text-[11px] p-0">
            <div className="w-full border-b border-black">
              <p className="font-bold px-3 py-1 leading-tight text-sm">
                {category}
              </p>
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

interface SongSpreadDisplayProps {
  spread: CategorySpread[]
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
  /** Max height for the entire card, e.g. "max-h-[400px]" */
  cardMaxHeight?: string
  /** Tooltip position; default "left". Use "top" for venue song spread. */
  tooltipSide?: "left" | "right" | "top" | "bottom"
}

function getSongNameForSort(s: string): string {
  const bracketIdx = s.indexOf(" [")
  return bracketIdx >= 0 ? s.slice(0, bracketIdx) : s
}

export function SongSpreadDisplay({
  spread,
  hoveredCategory = null,
  onCategoryHover,
  cardMaxHeight,
  tooltipSide = "left",
}: SongSpreadDisplayProps) {
  const isDesktop = useIsDesktopContentLayout()
  const maxCount = spread.length > 0 ? Math.max(...spread.map((s) => s.count)) : 0

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

  return (
    <Card className={cardClassName}>
      <div className="px-3 py-1.5 bg-muted/60 shrink-0">
        <h2 className="text-sm font-semibold">Song Spread</h2>
      </div>
      <CardContent className={contentClassName}>
        <ul className={ulClassName}>
          {spread.map(({ category, count, songs }) => {
            const songsSortedByName = [...songs].sort((a, b) =>
              getSongNameForSort(a).localeCompare(getSongNameForSort(b)),
            )
            const tooltipContent =
              songsSortedByName.length > 0 ? (
                <ul className="list-none space-y-[1px] overflow-y-auto text-[11px] leading-tight py-1.5">
                  {songsSortedByName.map((s) => {
                    const bracketIdx = s.indexOf(" [")
                    const songName = bracketIdx >= 0 ? s.slice(0, bracketIdx) : s
                    const artistPart =
                      bracketIdx >= 0 ? s.slice(bracketIdx) : null
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
                showTooltips={isDesktop}
                tooltipSide={tooltipSide}
              />
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

