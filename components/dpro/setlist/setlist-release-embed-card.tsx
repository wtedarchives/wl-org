"use client"

import { useEffect, useState } from "react"
import { CircleNotch, X } from "@phosphor-icons/react"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ShowRelease } from "@/hooks/use-setlist-releases"

export type SetlistReleaseEmbedVisualVariant = "dpro" | "wl-home-v2"

function getYouTubeEmbedUrl(link: string): string | null {
  try {
    const url = new URL(link)
    if (url.hostname.includes("youtube.com") && url.pathname.includes("/embed/")) {
      return link
    }
    if (url.hostname.includes("youtube.com") && url.searchParams.has("v")) {
      const v = url.searchParams.get("v")
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    if (url.hostname === "youtu.be") {
      const v = url.pathname.slice(1).split("?")[0]
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
  } catch {
    // ignore
  }
  return null
}

interface SetlistReleaseEmbedCardProps {
  release: ShowRelease
  type: "bandcamp" | "youtube"
  bandcampAlbumId: string | null
  /** When set, the album embed opens positioned at this specific track. */
  bandcampTrackId?: number | null
  bandcampLoading?: boolean
  onClose: () => void
  isClosing?: boolean
  fullWidth?: boolean
  visualVariant?: SetlistReleaseEmbedVisualVariant
}

export function SetlistReleaseEmbedCard({
  release,
  type,
  bandcampAlbumId,
  bandcampTrackId = null,
  bandcampLoading = false,
  onClose,
  isClosing = false,
  fullWidth = false,
  visualVariant = "dpro",
}: SetlistReleaseEmbedCardProps) {
  const isV2 = visualVariant === "wl-home-v2"
  const isDesktop = useIsDesktopContentLayout()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const youtubeEmbedUrl =
    type === "youtube" && release.release_link
      ? getYouTubeEmbedUrl(release.release_link)
      : null

  const bandcampEmbedUrl =
    type === "bandcamp" && bandcampAlbumId
      ? `https://bandcamp.com/EmbeddedPlayer/album=${bandcampAlbumId}/size=large/bgcol=333333/linkcol=0fa2d1/artwork=small/${
          bandcampTrackId ? `track=${bandcampTrackId}/` : ""
        }transparent=true/`
      : null

  const showContent =
    (type === "youtube" && youtubeEmbedUrl) ||
    (type === "bandcamp" && bandcampEmbedUrl)
  const showBandcampLoading = type === "bandcamp" && bandcampLoading

  return (
    <div
      className={cn(
        "flex flex-shrink-0 flex-col overflow-hidden transition-all duration-250 ease-out",
        isV2 ?
          "wl-home-v2-setlist-embed-card"
        : "rounded-lg border border-border/60 bg-card/80",
        fullWidth ? "w-full min-w-0" : "w-[400px] min-w-[400px]",
        mounted && !isClosing ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
        isClosing ? "translate-x-4 opacity-0" : "",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          isV2 ?
            "wl-home-v2-setlist-embed-card-header"
          : "border-b border-border/60 px-3 py-2",
        )}
      >
        <p
          className={cn(
            "truncate text-xs font-medium",
            isV2 ? "wl-home-v2-setlist-embed-card-title" : "text-foreground",
          )}
        >
          {release.release_displayname ?? release.release_id}
        </p>
        {isV2 ?
          <button
            type="button"
            onClick={onClose}
            className="wl-home-v2-setlist-embed-close"
            aria-label="Close embed"
          >
            <X className="size-3.5 shrink-0" aria-hidden />
          </button>
        : <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-6 w-6 shrink-0"
            aria-label="Close embed"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        }
      </div>
      <div
        className={cn(
          "relative w-full",
          isV2 ? "wl-home-v2-setlist-embed-card-body" : "bg-muted",
          type === "bandcamp" ? "min-h-[300px]" : "aspect-video",
        )}
      >
        {showBandcampLoading ?
          <div className="absolute inset-0 flex items-center justify-center">
            {isV2 ?
              <CircleNotch
                className="size-8 shrink-0 animate-spin text-white/45"
                aria-hidden
              />
            : <CircleNotch className="size-8 animate-spin text-muted-foreground" aria-hidden />
            }
          </div>
        : showContent ? (
          <iframe
            src={youtubeEmbedUrl ?? bandcampEmbedUrl ?? ""}
            title={isDesktop ? (release.release_displayname ?? "Embed") : undefined}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : null}
      </div>
    </div>
  )
}
