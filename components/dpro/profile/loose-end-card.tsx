"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ImageOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  isLooseEndBadgeRemoteUrl,
  looseEndBadgePublicPath,
} from "@/lib/loose-end-badge-path"
import { cn } from "@/lib/utils"
import type { LooseEndDisplay } from "@/types/loose-ends"

/** Hint preload for the first N badges (visible Loose Ends grid); same files, earlier fetch. */
interface LooseEndCardProps {
  looseEnd: LooseEndDisplay
  /** When true, Next/Image adds preload + high fetch priority (use sparingly, ~first screen of cards). */
  imagePriority?: boolean
}

export function LooseEndCard({
  looseEnd,
  imagePriority = false,
}: LooseEndCardProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const badgeSrc = looseEndBadgePublicPath(looseEnd.end_local_file)
  const badgeRemote = isLooseEndBadgeRemoteUrl(badgeSrc)

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-row items-stretch overflow-hidden border-border/80 py-0 gap-0 shadow-sm transition-[background-color,box-shadow] hover:shadow-md",
        looseEnd.isCompleted
          ? "bg-emerald-500/[0.15] hover:bg-emerald-500/[0.25]"
          : "bg-muted hover:bg-muted/20"
      )}
    >
      <div
        className={cn(
          "flex w-20 shrink-0 items-center justify-center self-stretch border-r border-border/60 sm:w-24 md:w-[7.25rem]",
          looseEnd.isCompleted ? "bg-emerald-500/[0.06]" : "bg-muted/50"
        )}
      >
        <div
          className={cn(
            "relative size-20 overflow-hidden rounded-md p-2 sm:size-24 md:size-[7.25rem]",
            "transition-[filter,opacity] duration-300 ease-out",
            !looseEnd.isCompleted && "opacity-[0.20] grayscale"
          )}
        >
          {!imgFailed && badgeSrc ? (
            <Image
              src={badgeSrc}
              alt={`${looseEnd.end} badge`}
              width={116}
              height={116}
              className="size-full object-cover"
              sizes="(max-width: 639px) 80px, (max-width: 1023px) 96px, 116px"
              priority={imagePriority}
              fetchPriority={imagePriority ? "high" : "low"}
              unoptimized={badgeRemote}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8 opacity-40 sm:size-10" aria-hidden />
            </div>
          )}
        </div>
      </div>
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug">{looseEnd.end}</h3>
          {looseEnd.isCompleted && (
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
              title="Collected"
              aria-label="Collected"
            >
              <Check className="size-3" strokeWidth={2.5} aria-hidden />
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-muted-foreground min-w-0 text-xs leading-tight",
            looseEnd.progress && "min-h-0 flex-1"
          )}
        >
          {looseEnd.end_description}
        </p>
        {looseEnd.progress && (
          <div className="mt-auto shrink-0 space-y-1 pt-0.5">
            <div className="text-muted-foreground flex justify-between text-[0.65rem] tabular-nums">
              <span>
                {looseEnd.progress.seen}/{looseEnd.progress.total}
              </span>
              <span>{looseEnd.progress.percentage}%</span>
            </div>
            <Progress
              value={looseEnd.progress.percentage}
              className="h-2 rounded-full border border-border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
