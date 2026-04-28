"use client"

import {
  type MouseEvent as ReactMouseEvent,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { CircleNotch } from "@phosphor-icons/react"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import { normalizeBandcampUrl } from "@/lib/normalize-bandcamp-url"
import { cn } from "@/lib/utils"
import { ReleaseServiceIcon } from "@/components/dpro/setlist/setlist-media-service-icon"
import { WlHomeV2MediaReleaseTitle } from "@/components/dpro/setlist/setlist-media-wl-v2-title"
import { isEmbeddableService } from "@/components/dpro/setlist/setlist-media-section.model"

export type SetlistMediaReleaseRowProps = {
  release: ShowRelease
  isV2: boolean
  isMobile: boolean
  activeEmbedReleaseId: string | null
  loadingReleaseId: string | null
  onStreamingClick: (
    e: ReactMouseEvent,
    release: ShowRelease,
  ) => void | Promise<void>
  onReleaseHover?: (releaseId: string | null) => void
}

export function SetlistMediaReleaseRow({
  release: r,
  isV2,
  isMobile,
  activeEmbedReleaseId,
  loadingReleaseId,
  onStreamingClick,
  onReleaseHover,
}: SetlistMediaReleaseRowProps) {
  const isSelected =
    !!activeEmbedReleaseId && r.release_id === activeEmbedReleaseId
  const isDimmed = !!activeEmbedReleaseId && !isSelected
  const isEmbeddable =
    isEmbeddableService(r.release_service) && !!r.release_link

  const releaseHoverProps = {
    onMouseEnter: () => onReleaseHover?.(r.release_id),
    onMouseLeave: () => onReleaseHover?.(null),
  }

  if (isMobile && !isV2) {
    const rowContent = (
      <>
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded",
            isV2 ? "size-[57px] border border-[rgb(53,56,54)] bg-black/35" : "size-10 border border-border/60 bg-muted",
          )}
        >
          {r.release_artwork ?
            <Image
              src={r.release_artwork}
              alt=""
              width={isV2 ? 57 : 40}
              height={isV2 ? 57 : 40}
              className="size-full object-cover"
              unoptimized
            />
          : <div
              className={cn(
                "flex size-full items-center justify-center text-[10px]",
                isV2 ? "text-white/45" : "text-muted-foreground",
              )}
            >
              —
            </div>
          }
          {loadingReleaseId === r.release_id && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                isV2 ? "bg-black/55" : "bg-muted/80",
              )}
            >
              {isV2 ?
                <CircleNotch
                  className="size-4 shrink-0 animate-spin text-white/55"
                  aria-hidden
                />
              : <CircleNotch className="size-4 animate-spin text-muted-foreground" aria-hidden />
              }
            </div>
          )}
        </div>
        <div
          className={cn(
            "min-w-0 flex-1",
            isV2 && "flex flex-col gap-[3px]",
          )}
        >
          {isV2 ?
            <WlHomeV2MediaReleaseTitle
              text={r.release_displayname ?? r.release_id}
              className={cn(
                "wl-home-v2-setlist-media-title min-w-0 line-clamp-2 text-xs font-medium text-white/[0.92]",
              )}
            />
          : <p
              className={cn(
                "truncate text-xs font-medium",
                "text-foreground",
              )}
            >
              {r.release_displayname ?? r.release_id}
            </p>
          }
          <div
            className={cn(
              "flex items-center gap-1.5",
              isV2 ?
                "wl-home-v2-setlist-media-service-row"
              : "text-[10px] text-muted-foreground",
            )}
          >
            <ReleaseServiceIcon service={r.release_service} />
            <span>{r.release_service ?? "—"}</span>
          </div>
        </div>
      </>
    )
    const rowClassName = cn(
      "flex items-center gap-2",
      isV2 ?
        "wl-home-v2-setlist-media-row px-[14px] py-2.5 rounded-[10px] border border-[rgb(63,65,64)] bg-[rgba(0,0,0,0.45)] transition-all duration-200 hover:scale-[1.02]"
      : "px-2 py-2 rounded-lg border border-border/60 bg-muted/30 transition-colors",
      isDimmed ? "opacity-30" : "hover:opacity-80",
      isEmbeddable &&
        (isV2 ? "hover:bg-[rgba(0,0,0,0.55)]" : "hover:bg-muted/60"),
    )

    if (isEmbeddable) {
      return (
        <button
          key={r.release_id}
          type="button"
          onClick={(e) => onStreamingClick(e, r)}
          className={`${rowClassName} w-full cursor-pointer text-left`}
          {...releaseHoverProps}
        >
          {rowContent}
        </button>
      )
    }
    if (r.release_link) {
      return (
        <Link
          key={r.release_id}
          href={normalizeBandcampUrl(r.release_link) ?? r.release_link}
          target="_blank"
          rel="noopener noreferrer"
          className={rowClassName}
          {...releaseHoverProps}
        >
          {rowContent}
        </Link>
      )
    }
    return (
      <div key={r.release_id} className={rowClassName} {...releaseHoverProps}>
        {rowContent}
      </div>
    )
  }

  const content = (
    <>
      <div
        className={cn(
          "relative shrink-0",
          isV2 ? "h-[57px] w-[57px] bg-black/35" : "aspect-square w-full bg-muted",
        )}
      >
        {r.release_artwork ?
          <Image
            src={r.release_artwork}
            alt=""
            width={isV2 ? 57 : 200}
            height={isV2 ? 57 : 200}
            className="h-full w-full object-cover"
            unoptimized
          />
        : <div
            className={cn(
              "flex h-full w-full items-center justify-center text-xs",
              isV2 ? "text-white/45" : "text-muted-foreground",
            )}
          >
            No image
          </div>
        }
        {loadingReleaseId === r.release_id && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              isV2 ? "bg-black/55" : "bg-muted/80",
            )}
          >
            {isV2 ?
              <CircleNotch
                className="size-6 shrink-0 animate-spin text-white/55"
                aria-hidden
              />
            : <CircleNotch className="size-6 animate-spin text-muted-foreground" aria-hidden />
            }
          </div>
        )}
      </div>
      <div
        className={cn(
          isV2 ?
            "wl-home-v2-setlist-media-tile-body wl-home-v2-setlist-media-tile-body--row"
          : "space-y-0.5 p-2",
        )}
      >
        {isV2 ?
          <WlHomeV2MediaReleaseTitle
            text={r.release_displayname ?? r.release_id}
            className={cn(
              "wl-home-v2-setlist-media-title min-w-0 line-clamp-2 text-xs font-medium text-white/[0.92]",
            )}
          />
        : <p
            className={cn(
              "line-clamp-2 text-xs font-medium",
              "text-foreground",
            )}
          >
            {r.release_displayname ?? r.release_id}
          </p>
        }
        <div
          className={cn(
            "flex items-center gap-1.5",
            isV2 ?
              "wl-home-v2-setlist-media-service-row"
            : "text-[10px] text-muted-foreground",
          )}
        >
          <ReleaseServiceIcon service={r.release_service} />
          <span>{r.release_service ?? "—"}</span>
        </div>
      </div>
    </>
  )
  const className = cn(
    "flex shrink-0 overflow-hidden transition-all duration-200",
    isV2 ?
      cn(
        "wl-home-v2-setlist-media-tile box-border max-w-full flex-row items-center rounded-[10px] border border-[rgb(63,65,64)] bg-[rgba(0,0,0,0.45)] hover:scale-[1.02] hover:bg-[rgba(0,0,0,0.55)]",
        isMobile ? "min-w-0 w-full" : "w-[250px]",
      )
    : "w-[200px] flex-col rounded-lg border border-border/60 bg-muted/30 hover:scale-[1.02] hover:!bg-muted",
    isDimmed ? "opacity-30 hover:opacity-80" : "",
  )
  if (isEmbeddable) {
    return (
      <button
        key={r.release_id}
        type="button"
        onClick={(e) => onStreamingClick(e, r)}
        className={`${className} cursor-pointer text-left`}
        {...releaseHoverProps}
      >
        {content}
      </button>
    )
  }
  if (r.release_link) {
    return (
      <Link
        key={r.release_id}
        href={normalizeBandcampUrl(r.release_link) ?? r.release_link}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...releaseHoverProps}
      >
        {content}
      </Link>
    )
  }
  return (
    <div key={r.release_id} className={className} {...releaseHoverProps}>
      {content}
    </div>
  )
}
