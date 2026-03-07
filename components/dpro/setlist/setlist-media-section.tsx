"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { FaYoutube, FaSpotify } from "react-icons/fa"
import { SiBandcamp } from "react-icons/si"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import { useIsMobile } from "@/hooks/use-mobile"
import { SetlistReleaseEmbedCard } from "./setlist-release-embed-card"

const SERVICE_COLORS: Record<string, string> = {
  youtube: "#ff0033",
  spotify: "#1ed760",
  bandcamp: "#0fa2d1",
}

function ReleaseServiceIcon({ service }: { service: string | null }) {
  if (!service?.trim()) return null
  const key = service.toLowerCase().trim()
  if (key === "nugs") {
    return (
      <Image
        src="/NugsColor.png"
        alt=""
        width={14}
        height={14}
        className="shrink-0 rounded-sm object-contain"
      />
    )
  }
  if (key === "youtube") {
    return <FaYoutube className="shrink-0 size-3.5" style={{ color: SERVICE_COLORS.youtube }} />
  }
  if (key === "spotify") {
    return <FaSpotify className="shrink-0 size-3.5" style={{ color: SERVICE_COLORS.spotify }} />
  }
  if (key === "bandcamp") {
    return <SiBandcamp className="shrink-0 size-3.5" style={{ color: SERVICE_COLORS.bandcamp }} />
  }
  return null
}

function isEmbeddableService(service: string | null): boolean {
  if (!service?.trim()) return false
  const key = service.toLowerCase().trim()
  return key === "bandcamp" || key === "youtube"
}

interface SetlistMediaSectionProps {
  releases: ShowRelease[]
}

export function SetlistMediaSection({ releases }: SetlistMediaSectionProps) {
  const isMobile = useIsMobile()
  const [activeEmbed, setActiveEmbed] = useState<{
    release: ShowRelease
    type: "bandcamp" | "youtube"
  } | null>(null)
  const [bandcampAlbumId, setBandcampAlbumId] = useState<string | null>(null)
  const [loadingReleaseId, setLoadingReleaseId] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const nowPlayingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeEmbed) {
      const id = requestAnimationFrame(() => {
        nowPlayingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      })
      return () => cancelAnimationFrame(id)
    }
  }, [activeEmbed])

  const handleStreamingClick = useCallback(
    async (e: React.MouseEvent, release: ShowRelease, index: number) => {
      e.preventDefault()
      e.stopPropagation()

      const service = (release.release_service ?? "").toLowerCase().trim()
      if (service !== "bandcamp" && service !== "youtube") return
      if (!release.release_link) return

      const isSameRelease =
        activeEmbed?.release.release_id === release.release_id

      if (isSameRelease) {
        setIsClosing(true)
        await new Promise((r) => setTimeout(r, 250))
        setActiveEmbed(null)
        setBandcampAlbumId(null)
        setIsClosing(false)
        return
      }

      if (service === "bandcamp") {
        setActiveEmbed(null)
        setBandcampAlbumId(null)
        setActiveEmbed({ release, type: "bandcamp" })
        setBandcampAlbumId(null)
        setLoadingReleaseId(release.release_id)

        try {
          const res = await fetch(
            `/api/bandcamp-album-id?url=${encodeURIComponent(release.release_link)}`
          )
          const data = await res.json()
          if (data.albumId) {
            setBandcampAlbumId(data.albumId)
          } else {
            setActiveEmbed(null)
          }
        } catch {
          setActiveEmbed(null)
        } finally {
          setLoadingReleaseId(null)
        }
      } else {
        setActiveEmbed(null)
        setBandcampAlbumId(null)
        setActiveEmbed({ release, type: "youtube" })
      }
    },
    [activeEmbed]
  )

  const handleCloseEmbed = useCallback(async () => {
    setIsClosing(true)
    await new Promise((r) => setTimeout(r, 250))
    setActiveEmbed(null)
    setBandcampAlbumId(null)
    setIsClosing(false)
  }, [])

  if (releases.length === 0) return null

  const renderReleaseRow = (r: ShowRelease, index: number) => {
    const isSelected =
      !!activeEmbed && r.release_id === activeEmbed.release.release_id
    const isDimmed = !!activeEmbed && !isSelected
    const isEmbeddable =
      isEmbeddableService(r.release_service) && r.release_link

    if (isMobile) {
      const rowContent = (
        <>
          <div className="relative size-10 shrink-0 overflow-hidden rounded border border-border/60 bg-muted">
            {r.release_artwork ? (
              <Image
                src={r.release_artwork}
                alt=""
                width={40}
                height={40}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground text-[10px]">
                —
              </div>
            )}
            {loadingReleaseId === r.release_id && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {r.release_displayname ?? r.release_id}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ReleaseServiceIcon service={r.release_service} />
              <span>{r.release_service ?? "—"}</span>
            </div>
          </div>
        </>
      )
      const rowClassName = `flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2 py-2 transition-colors ${
        isDimmed ? "opacity-30" : "hover:opacity-80"
      } ${isEmbeddable ? "hover:bg-muted/60" : ""}`

      if (isEmbeddable) {
        return (
          <button
            key={r.release_id}
            type="button"
            onClick={(e) => handleStreamingClick(e, r, index)}
            className={`${rowClassName} w-full cursor-pointer text-left`}
          >
            {rowContent}
          </button>
        )
      }
      if (r.release_link) {
        return (
          <Link
            key={r.release_id}
            href={r.release_link}
            target="_blank"
            rel="noopener noreferrer"
            className={rowClassName}
          >
            {rowContent}
          </Link>
        )
      }
      return (
        <div key={r.release_id} className={rowClassName}>
          {rowContent}
        </div>
      )
    }

    const content = (
      <>
        <div className="w-full aspect-square relative shrink-0 bg-muted">
          {r.release_artwork ? (
            <Image
              src={r.release_artwork}
              alt=""
              width={200}
              height={200}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
          {loadingReleaseId === r.release_id && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-2 space-y-0.5">
          <p className="text-xs font-medium text-foreground line-clamp-2">
            {r.release_displayname ?? r.release_id}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ReleaseServiceIcon service={r.release_service} />
            <span>{r.release_service ?? "—"}</span>
          </div>
        </div>
      </>
    )
    const className =
      `flex flex-col w-[200px] shrink-0 rounded-lg overflow-hidden border border-border/60 bg-muted/30 transition-all duration-200 hover:scale-[1.02] hover:!bg-muted ${
        isDimmed ? "opacity-30 hover:opacity-80" : ""
      }`

    if (isEmbeddable) {
      return (
        <button
          key={r.release_id}
          type="button"
          onClick={(e) => handleStreamingClick(e, r, index)}
          className={`${className} cursor-pointer text-left`}
        >
          {content}
        </button>
      )
    }
    if (r.release_link) {
      return (
        <Link
          key={r.release_id}
          href={r.release_link}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </Link>
      )
    }
    return (
      <div key={r.release_id} className={className}>
        {content}
      </div>
    )
  }

  return (
    <div className="flex flex-row flex-wrap items-start gap-3 w-full max-w-full">
      <div className="flex min-w-[250px] flex-1 flex-col gap-2">
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Media
          </h2>
          <div
            className={
              isMobile ? "flex flex-col gap-2" : "flex flex-wrap gap-3"
            }
          >
            {releases.map((r, index) => renderReleaseRow(r, index))}
          </div>
        </>
      </div>
      {activeEmbed && (
        <div
          ref={nowPlayingRef}
          className={`flex flex-shrink-0 flex-col gap-2 ${
            isMobile ? "w-full min-w-0" : "min-w-[400px]"
          }`}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Now Playing
          </h2>
          <SetlistReleaseEmbedCard
            release={activeEmbed.release}
            type={activeEmbed.type}
            bandcampAlbumId={bandcampAlbumId}
            bandcampLoading={
              activeEmbed.type === "bandcamp" &&
              loadingReleaseId === activeEmbed.release.release_id
            }
            onClose={handleCloseEmbed}
            isClosing={isClosing}
            fullWidth={isMobile}
          />
        </div>
      )}
    </div>
  )
}
