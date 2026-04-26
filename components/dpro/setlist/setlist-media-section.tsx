"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CircleNotch,
  Parallelogram,
  SpotifyLogo,
  YoutubeLogo,
} from "@phosphor-icons/react"
import { Loader2 } from "lucide-react"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import { useIsMobile } from "@/hooks/use-mobile"
import { normalizeBandcampUrl } from "@/lib/normalize-bandcamp-url"
import { cn } from "@/lib/utils"
import {
  SetlistReleaseEmbedCard,
  type SetlistReleaseEmbedVisualVariant,
} from "./setlist-release-embed-card"

const SERVICE_COLORS: Record<string, string> = {
  youtube: "#ff0033",
  spotify: "#1ed760",
  bandcamp: "#0fa2d1",
}

const MEDIA_TITLE_SEGUE_ARROW = "\u2192"

/** WL v2: tighter title line-height + `→` matches setlist `.song-cell .segue`. */
function WlHomeV2MediaReleaseTitle({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  if (!text.includes(MEDIA_TITLE_SEGUE_ARROW)) {
    return <p className={className}>{text}</p>
  }
  const segments = text.split(MEDIA_TITLE_SEGUE_ARROW)
  return (
    <p className={className}>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {seg}
          {i < segments.length - 1 ?
            <span className="wl-home-v2-setlist-media-title-segue">
              {MEDIA_TITLE_SEGUE_ARROW}
            </span>
          : null}
        </Fragment>
      ))}
    </p>
  )
}

export function ReleaseServiceIcon({ service }: { service: string | null }) {
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
  if (key === "discogs") {
    return (
      <Image
        src="/discogs.png"
        alt=""
        width={14}
        height={14}
        className="shrink-0 rounded-sm object-contain"
      />
    )
  }
  if (key === "youtube") {
    return (
      <YoutubeLogo
        className="shrink-0"
        size={14}
        weight="fill"
        style={{ color: SERVICE_COLORS.youtube }}
        aria-hidden
      />
    )
  }
  if (key === "spotify") {
    return (
      <SpotifyLogo
        className="shrink-0"
        size={14}
        weight="fill"
        style={{ color: SERVICE_COLORS.spotify }}
        aria-hidden
      />
    )
  }
  if (key === "bandcamp") {
    return (
      <Parallelogram
        className="shrink-0"
        size={14}
        weight="fill"
        style={{ color: SERVICE_COLORS.bandcamp }}
        aria-hidden
      />
    )
  }
  return null
}

function isEmbeddableService(service: string | null): boolean {
  if (!service?.trim()) return false
  const key = service.toLowerCase().trim()
  return key === "bandcamp" || key === "youtube"
}

/** Lowercase key for grouping + sort; empty/missing → `other`. */
const OTHER_SERVICE_KEY = "other"

const KNOWN_SERVICE_LABELS: Record<string, string> = {
  bandcamp: "Bandcamp",
  discogs: "Discogs",
  nugs: "Nugs",
  spotify: "Spotify",
  youtube: "YouTube",
}

function releaseServiceSortKey(release: ShowRelease): string {
  const k = (release.release_service ?? "").trim().toLowerCase()
  return k || OTHER_SERVICE_KEY
}

function releaseServiceSectionLabel(sortKey: string): string {
  if (sortKey === OTHER_SERVICE_KEY) return "Other"
  return (
    KNOWN_SERVICE_LABELS[sortKey] ??
    sortKey.replace(/^\w/, (c) => c.toUpperCase())
  )
}

function groupReleasesByService(releases: ShowRelease[]): Map<string, ShowRelease[]> {
  const map = new Map<string, ShowRelease[]>()
  for (const r of releases) {
    const k = releaseServiceSortKey(r)
    const list = map.get(k)
    if (list) list.push(r)
    else map.set(k, [r])
  }
  for (const [, list] of map) {
    list.sort((a, b) => {
      const oa = a.release_order ?? Number.MAX_SAFE_INTEGER
      const ob = b.release_order ?? Number.MAX_SAFE_INTEGER
      if (oa !== ob) return oa - ob
      return a.release_id.localeCompare(b.release_id)
    })
  }
  return map
}

interface SetlistMediaSectionProps {
  releases: ShowRelease[]
  /** When user hovers a release, call with release_id; on leave call with null. */
  onReleaseHover?: (releaseId: string | null) => void
  /** WL Home v2 setlist archive styling (Geist / setlist-card treatment). */
  visualVariant?: SetlistReleaseEmbedVisualVariant
}

export function SetlistMediaSection({
  releases,
  onReleaseHover,
  visualVariant = "dpro",
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
    async (e: React.MouseEvent, release: ShowRelease) => {
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

  const renderReleaseRow = (r: ShowRelease) => {
    const isSelected =
      !!activeEmbed && r.release_id === activeEmbed.release.release_id
    const isDimmed = !!activeEmbed && !isSelected
    const isEmbeddable =
      isEmbeddableService(r.release_service) && r.release_link

    if (isMobile) {
      const rowContent = (
        <>
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded",
              isV2 ? "size-[57px] border border-[rgb(53,56,54)] bg-black/35" : "size-10 border border-border/60 bg-muted",
            )}
          >
            {r.release_artwork ? (
              <Image
                src={r.release_artwork}
                alt=""
                width={isV2 ? 57 : 40}
                height={isV2 ? 57 : 40}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className={cn(
                  "flex size-full items-center justify-center text-[10px]",
                  isV2 ? "text-white/45" : "text-muted-foreground",
                )}
              >
                —
              </div>
            )}
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
                : <Loader2 className="size-4 animate-spin text-muted-foreground" />
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

      const releaseHoverProps = {
        onMouseEnter: () => onReleaseHover?.(r.release_id),
        onMouseLeave: () => onReleaseHover?.(null),
      }
      if (isEmbeddable) {
        return (
          <button
            key={r.release_id}
            type="button"
            onClick={(e) => handleStreamingClick(e, r)}
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
          {r.release_artwork ? (
            <Image
              src={r.release_artwork}
              alt=""
              width={isV2 ? 57 : 200}
              height={isV2 ? 57 : 200}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center text-xs",
                isV2 ? "text-white/45" : "text-muted-foreground",
              )}
            >
              No image
            </div>
          )}
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
              : <Loader2 className="size-6 animate-spin text-muted-foreground" />
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
        "wl-home-v2-setlist-media-tile w-[min(100%,250px)] max-w-[250px] flex-row items-center rounded-[10px] border border-[rgb(63,65,64)] bg-[rgba(0,0,0,0.45)] hover:scale-[1.02] hover:bg-[rgba(0,0,0,0.55)]"
      : "w-[200px] flex-col rounded-lg border border-border/60 bg-muted/30 hover:scale-[1.02] hover:!bg-muted",
      isDimmed ? "opacity-30 hover:opacity-80" : "",
    )
    const desktopHoverProps = {
      onMouseEnter: () => onReleaseHover?.(r.release_id),
      onMouseLeave: () => onReleaseHover?.(null),
    }
    if (isEmbeddable) {
      return (
        <button
          key={r.release_id}
          type="button"
          onClick={(e) => handleStreamingClick(e, r)}
          className={`${className} cursor-pointer text-left`}
          {...desktopHoverProps}
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
          {...desktopHoverProps}
        >
          {content}
        </Link>
      )
    }
    return (
      <div key={r.release_id} className={className} {...desktopHoverProps}>
        {content}
      </div>
    )
  }

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
  const serviceSectionKeys = [...grouped.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  )

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
              {(grouped.get(serviceKey) ?? []).map((r) => renderReleaseRow(r))}
            </div>
          </section>
        ))}
      </div>
    </>
  )

  const mediaColumn =
    isV2 ?
      <div className="wl-home-v2-setlist-media-main min-w-0">
        <div className="flex flex-col gap-2.5">{mediaHeadingAndTiles}</div>
      </div>
    : <div className="flex min-w-[250px] flex-1 flex-col gap-2">
        {mediaHeadingAndTiles}
      </div>

  const nowPlayingBlock =
    activeEmbed ?
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
      </div>
    : null

  if (isV2) {
    return (
      <div className="wl-home-v2-setlist-media-shell">
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
