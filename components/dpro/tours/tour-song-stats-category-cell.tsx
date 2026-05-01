"use client"

import Image from "next/image"
import { useCategoryArtwork } from "@/hooks/use-category-artwork"
import { cn } from "@/lib/utils"

export function TourSongStatsCategoryCell({
  category,
  wlHomeV2 = false,
}: {
  category: string
  wlHomeV2?: boolean
}) {
  const { artwork, loaded } = useCategoryArtwork(category)
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm py-0.5",
          wlHomeV2 ?
            "border border-[rgb(63,65,64)] bg-black/20"
          : "bg-muted",
        )}
      >
        {loaded && artwork ?
          <Image
            src={artwork}
            alt={category}
            width={20}
            height={20}
            className="size-5 object-cover"
            unoptimized
            onError={(e) => {
              const el = e.target as HTMLImageElement
              if (el) el.style.display = "none"
            }}
          />
        : <span
            className={cn(
              "truncate px-0.5 text-[10px]",
              wlHomeV2 ?
                "text-white/46"
              : "text-muted-foreground",
            )}
          >
            {category.slice(0, 2)}
          </span>
        }
      </span>
      <span className={cn(wlHomeV2 ? "text-[11px] text-muted-foreground" : "text-xs text-muted-foreground")}>
        {category}
      </span>
    </div>
  )
}
