"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ImageOff, Info, X } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  isLooseEndBadgeRemoteUrl,
  looseEndBadgePublicPath,
} from "@/lib/loose-end-badge-path"
import { cn } from "@/lib/utils"
import type { LooseEndDisplay } from "@/types/loose-ends"

import "./loose-end-card.css"

interface LooseEndCardProps {
  looseEnd: LooseEndDisplay
  imagePriority?: boolean
}

export function LooseEndCard({
  looseEnd,
  imagePriority = false,
}: LooseEndCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const [songsOpen, setSongsOpen] = useState(false)

  const badgeSrc = looseEndBadgePublicPath(looseEnd.end_local_file)
  const badgeRemote = isLooseEndBadgeRemoteUrl(badgeSrc)

  const showCompletionistSongs =
    looseEnd.end_category === "Completionist" &&
    looseEnd.completionistSongs !== undefined

  const mainRow = (
    <div className="wl-loose-end-card__row">
      <div className="wl-loose-end-card__art">
        <div className="wl-loose-end-card__art-inner">
          {!imgFailed && badgeSrc ? (
            <Image
              src={badgeSrc}
              alt=""
              aria-hidden
              fill
              className="object-contain"
              sizes="(max-width: 639px) 80px, (max-width: 767px) 96px, 108px"
              priority={imagePriority}
              fetchPriority={imagePriority ? "high" : "low"}
              unoptimized={badgeRemote}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-white/35">
              <ImageOff className="size-8" strokeWidth={1.25} aria-hidden />
            </div>
          )}
        </div>
      </div>
      <div className="wl-loose-end-card__body">
        <div className="wl-loose-end-card__title-row">
          <h3 className="wl-loose-end-card__title">{looseEnd.end}</h3>
          {looseEnd.isCompleted && (
            <span
              className="wl-loose-end-card__check"
              title="Collected"
              aria-label="Collected"
            >
              <Check className="size-2.5" strokeWidth={3} aria-hidden />
            </span>
          )}
        </div>
        <p
          className={cn(
            "wl-loose-end-card__desc min-w-0",
            looseEnd.progress && "min-h-0 flex-1",
          )}
        >
          {looseEnd.end_description}
        </p>
        {looseEnd.progress && (
          <div className="wl-loose-end-card__progress">
            <div className="wl-loose-end-card__progress-meta">
              <span>
                {looseEnd.progress.seen}/{looseEnd.progress.total}
              </span>
              <span>{looseEnd.progress.percentage}%</span>
            </div>
            <Progress
              value={looseEnd.progress.percentage}
              className="h-1.5 rounded-full border border-white/10 bg-black/30"
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <article
      className={cn(
        "wl-loose-end-card",
        looseEnd.isCompleted && "wl-loose-end-card--completed",
        showCompletionistSongs && "wl-loose-end-card--completionist",
      )}
    >
      {showCompletionistSongs ?
        <Collapsible
          open={songsOpen}
          onOpenChange={setSongsOpen}
          className="wl-loose-end-card__collapsible"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "wl-loose-end-card__info-btn",
                "touch-manipulation outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              )}
              aria-expanded={songsOpen}
              aria-label={
                songsOpen ?
                  `Hide song list for ${looseEnd.end}`
                : `Show song list for ${looseEnd.end}`
              }
            >
              <Info className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </CollapsibleTrigger>
          {mainRow}
          <div className="wl-loose-end-card__songs">
            <CollapsibleContent className="wl-loose-end-card__songs-content">
              {looseEnd.completionistSongs!.length === 0 ?
                <p className="wl-loose-end-card__songs-empty">
                  No songs from this category have a canonical performance yet.
                </p>
              : <ul
                  className="wl-loose-end-card__song-list"
                  aria-label={`Songs for ${looseEnd.end}`}
                >
                  {looseEnd.completionistSongs!.map((row) => (
                    <li
                      key={row.song}
                      className={cn(
                        "wl-loose-end-card__song-item",
                        row.heard && "wl-loose-end-card__song-item--heard",
                      )}
                      aria-label={
                        row.heard ?
                          `${row.song}, heard at an attended show`
                        : `${row.song}, not yet heard at an attended show`
                      }
                    >
                      <span
                        className="wl-loose-end-card__song-status"
                        aria-hidden
                      >
                        {row.heard ?
                          <Check
                            className="size-3.5 shrink-0 text-emerald-400"
                            strokeWidth={2.5}
                          />
                        : <X
                            className="size-3.5 shrink-0 text-red-500"
                            strokeWidth={2.5}
                          />
                        }
                      </span>
                      <span className="wl-loose-end-card__song-name">
                        {row.song}
                      </span>
                    </li>
                  ))}
                </ul>
              }
            </CollapsibleContent>
          </div>
        </Collapsible>
      : mainRow}
    </article>
  )
}
