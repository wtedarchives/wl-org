"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import type { BandcampEntryTrack } from "@/types/setlist"
import { useIsMobile } from "@/hooks/use-mobile"
import { normalizeBandcampUrl } from "@/lib/normalize-bandcamp-url"
import {
  SetlistReleaseEmbedCard,
  type SetlistReleaseEmbedVisualVariant,
} from "./setlist-release-embed-card"
import {
  compareServiceSectionKeys,
  groupReleasesByService,
  OTHER_SERVICE_KEY,
  releaseServiceSectionLabel,
} from "@/components/dpro/setlist/setlist-media-section.model"
import { ReleaseServiceIcon } from "@/components/dpro/setlist/setlist-media-service-icon"
import { SetlistMediaReleaseRow } from "@/components/dpro/setlist/setlist-media-release-row"

export { ReleaseServiceIcon } from "@/components/dpro/setlist/setlist-media-service-icon"

interface SetlistMediaSectionProps {
  releases: ShowRelease[]
  /** When user hovers a release, call with release_id; on leave call with null. */
  onReleaseHover?: (releaseId: string | null) => void
  /** WL Home v2 setlist archive styling (Geist / setlist-card treatment). */
  visualVariant?: SetlistReleaseEmbedVisualVariant
  /** Controlled Bandcamp track embed, opened from a setlist row's Bandcamp icon. */
  bandcampTrackEmbed?: BandcampEntryTrack | null
  /** Close the controlled Bandcamp track embed. */
  onCloseBandcampTrack?: () => void
  /** Controlled YouTube release embed, opened from a setlist row's YouTube icon. */
  youtubeReleaseEmbed?: ShowRelease | null
  /** Close the controlled YouTube release embed. */
  onCloseYoutube?: () => void
}

export function SetlistMediaSection({
  releases,
  onReleaseHover,
  visualVariant = "dpro",
  bandcampTrackEmbed = null,
  onCloseBandcampTrack,
  youtubeReleaseEmbed = null,
  onCloseYoutube,
}: SetlistMediaSectionProps) {
  const isV2 = visualVariant === "wl-home-v2"
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
    if (activeEmbed || bandcampTrackEmbed || youtubeReleaseEmbed) {
      const id = requestAnimationFrame(() => {
        nowPlayingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      })
      return () => cancelAnimationFrame(id)
    }
  }, [activeEmbed, bandcampTrackEmbed, youtubeReleaseEmbed])

  // A row-icon embed (Bandcamp track or YouTube video) takes over the Now Playing
  // slot — clear any release-tile embed so only one plays at a time.
  useEffect(() => {
    if (bandcampTrackEmbed || youtubeReleaseEmbed) {
      setActiveEmbed(null)
      setBandcampAlbumId(null)
    }
  }, [bandcampTrackEmbed, youtubeReleaseEmbed])

  const handleStreamingClick = useCallback(
    async (e: React.MouseEvent, release: ShowRelease) => {
      e.preventDefault()
      e.stopPropagation()

      const service = (release.release_service ?? "").toLowerCase().trim()
      if (service !== "bandcamp" && service !== "youtube") return
      if (!release.release_link) return

      // Opening a release-tile embed replaces any active row-icon embed.
      onCloseBandcampTrack?.()
      onCloseYoutube?.()

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

        const bandcampUrl = normalizeBandcampUrl(release.release_link)
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/functions/v1`
          : ""
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        try {
          if (!base || !bandcampUrl) {
            setActiveEmbed(null)
            return
          }
          const res = await fetch(
            `${base}/bandcamp-album-id?url=${encodeURIComponent(bandcampUrl)}`,
            {
              headers: {
                ...(anon
                  ? {
                      apikey: anon,
                      Authorization: `Bearer ${anon}`,
                    }
                  : {}),
              },
            },
          )
          const data = (await res.json()) as { albumId?: string; error?: string }
          if (res.ok && data.albumId) {
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
    [activeEmbed, onCloseBandcampTrack, onCloseYoutube],
  )

  const handleCloseEmbed = useCallback(async () => {
    setIsClosing(true)
    await new Promise((r) => setTimeout(r, 250))
    setActiveEmbed(null)
    setBandcampAlbumId(null)
    setIsClosing(false)
  }, [])

  if (releases.length === 0 && !bandcampTrackEmbed && !youtubeReleaseEmbed)
    return null

  const activeEmbedReleaseId =
    activeEmbed?.release.release_id ?? null

  // Synthetic release so the per-track Bandcamp embed reuses the release embed card.
  const bandcampTrackRelease: ShowRelease | null = bandcampTrackEmbed
    ? {
        release_id: `bandcamp-track-${bandcampTrackEmbed.track_id}`,
        release_displayname:
          bandcampTrackEmbed.track_title ?? "Bandcamp track",
        release_artwork: null,
        release_link: bandcampTrackEmbed.track_link,
        release_service: "bandcamp",
        release_order: null,
      }
    : null

  const headingClass = isV2 ?
      "wl-home-v2-setlist-media-heading"
    : "text-sm font-semibold uppercase tracking-wide text-muted-foreground"

  const subheadingClass = isV2 ?
      "wl-home-v2-setlist-media-subheading"
    : "text-[11px] font-semibold tracking-wide text-muted-foreground"

  const mediaTilesWrapClass = isMobile ?
      "flex flex-col gap-2"
    : "flex flex-wrap gap-3"

  const grouped = groupReleasesByService(releases)
  const serviceSectionKeys = [...grouped.keys()].sort(compareServiceSectionKeys)

  const mediaHeadingAndTiles = (
    <>
      <h2 className={headingClass}>Media</h2>
      <div className="flex flex-col gap-4">
        {serviceSectionKeys.map((serviceKey) => (
          <section key={serviceKey} className="flex flex-col gap-2">
            <h3
              className={cn(
                subheadingClass,
                "flex items-center gap-1.5 [&_img]:shrink-0",
              )}
            >
              <ReleaseServiceIcon
                service={
                  serviceKey === OTHER_SERVICE_KEY ? null : serviceKey
                }
              />
              {releaseServiceSectionLabel(serviceKey)}
            </h3>
            <div className={mediaTilesWrapClass}>
              {(grouped.get(serviceKey) ?? []).map((r) => (
                <SetlistMediaReleaseRow
                  key={r.release_id}
                  release={r}
                  isV2={isV2}
                  isMobile={isMobile}
                  activeEmbedReleaseId={activeEmbedReleaseId}
                  loadingReleaseId={loadingReleaseId}
                  onStreamingClick={handleStreamingClick}
                  onReleaseHover={onReleaseHover}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )

  const mediaColumn =
    releases.length === 0 ? null
    : isV2 ?
      <div className="wl-home-v2-setlist-media-main min-w-0">
        <div className="flex flex-col gap-2.5">{mediaHeadingAndTiles}</div>
      </div>
    : <div className="flex min-w-[250px] flex-1 flex-col gap-2">
        {mediaHeadingAndTiles}
      </div>

  const embedCard =
    bandcampTrackEmbed && bandcampTrackRelease ?
      <SetlistReleaseEmbedCard
        release={bandcampTrackRelease}
        type="bandcamp"
        bandcampAlbumId={String(bandcampTrackEmbed.album_id)}
        bandcampTrackId={bandcampTrackEmbed.track_id}
        onClose={() => onCloseBandcampTrack?.()}
        fullWidth={isMobile}
        visualVariant={visualVariant}
      />
    : youtubeReleaseEmbed ?
      <SetlistReleaseEmbedCard
        release={youtubeReleaseEmbed}
        type="youtube"
        bandcampAlbumId={null}
        onClose={() => onCloseYoutube?.()}
        fullWidth={isMobile}
        visualVariant={visualVariant}
      />
    : activeEmbed ?
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
        visualVariant={visualVariant}
      />
    : null

  const nowPlayingBlock =
    embedCard ?
      <div
        ref={nowPlayingRef}
        className={cn(
          "flex flex-shrink-0 flex-col",
          isV2 ? "gap-2.5" : "gap-2",
          isV2 && isMobile && "wl-home-v2-setlist-media-now-stack w-full min-w-0",
          isV2 && !isMobile && "wl-home-v2-setlist-media-now-float",
          !isV2 && isMobile && "w-full min-w-0",
          !isV2 && !isMobile && "min-w-[400px]",
        )}
      >
        <h2 className={headingClass}>Now Playing</h2>
        {embedCard}
      </div>
    : null

  if (isV2) {
    return (
      <div
        className={cn(
          "wl-home-v2-setlist-media-shell",
          (activeEmbed || bandcampTrackEmbed || youtubeReleaseEmbed) &&
            "wl-home-v2-setlist-media-shell--with-now-playing",
        )}
      >
        {isMobile ?
          <>
            {mediaColumn}
            {nowPlayingBlock}
          </>
        : <div className="wl-home-v2-setlist-media-float-root">
            {nowPlayingBlock}
            {mediaColumn}
          </div>
        }
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-full flex-row flex-wrap items-start gap-3">
      {mediaColumn}
      {nowPlayingBlock}
    </div>
  )
}
