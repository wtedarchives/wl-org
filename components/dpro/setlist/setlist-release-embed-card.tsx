"use client"

import { useEffect, useState } from "react"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ShowRelease } from "@/hooks/use-setlist-releases"

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
  bandcampLoading?: boolean
  onClose: () => void
  isClosing?: boolean
  fullWidth?: boolean
}

export function SetlistReleaseEmbedCard({
  release,
  type,
  bandcampAlbumId,
  bandcampLoading = false,
  onClose,
  isClosing = false,
  fullWidth = false,
}: SetlistReleaseEmbedCardProps) {
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
      ? `https://bandcamp.com/EmbeddedPlayer/album=${bandcampAlbumId}/size=large/bgcol=333333/linkcol=0fa2d1/artwork=small/transparent=true/`
      : null

  const showContent =
    (type === "youtube" && youtubeEmbedUrl) ||
    (type === "bandcamp" && bandcampEmbedUrl)
  const showBandcampLoading = type === "bandcamp" && bandcampLoading

  return (
    <div
      className={`
        flex flex-shrink-0 flex-col rounded-lg border border-border/60 bg-card/80 overflow-hidden
        ${fullWidth ? "w-full min-w-0" : "w-[400px] min-w-[400px]"}
        transition-all duration-250 ease-out
        ${mounted && !isClosing ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}
        ${isClosing ? "translate-x-4 opacity-0" : ""}
      `}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <p className="text-xs font-medium text-foreground truncate">
          {release.release_displayname ?? release.release_id}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="shrink-0 h-6 w-6"
          aria-label="Close embed"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <div
        className={`relative w-full bg-muted ${
          type === "bandcamp" ? "min-h-[300px]" : "aspect-video"
        }`}
      >
        {showBandcampLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : showContent ? (
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
