"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { DripfieldRotatingArtwork } from "@/components/dpro/rotating-bandcamp-artwork"
import { useCategoryArtwork } from "@/hooks/use-category-artwork"
import type { Show } from "@/types/setlist"
import { cn } from "@/lib/utils"
import { getListArchiveUrl } from "@/lib/list-archive-url"

const CATEGORY_LIST_ID = "81dbe56c-7cc4-466b-b8d7-47c1ca041afc"
const JIVE_LIST_ID = "c66cfb55-12a8-4cfe-9147-547d9e6c1736"
const DRIPFIELD_LIST_ID = "6b47d70f-202b-45fe-a5b1-203c031c6aad"

function BadgeLink({
  href,
  imageSrc,
  imageSlot,
  imageAlt,
  children,
  className,
  asideMediaLayout = false,
}: {
  href: string
  imageSrc?: string | null
  imageSlot?: React.ReactNode
  imageAlt: string
  children: React.ReactNode
  className?: string
  /** WL Home v2 aside: artwork flush left, full row height (matches media tiles). */
  asideMediaLayout?: boolean
}) {
  const artwork =
    imageSlot ??
    (imageSrc ?
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={asideMediaLayout ? 40 : 20}
        height={asideMediaLayout ? 40 : 20}
        className={
          asideMediaLayout ?
            "object-cover"
          : "size-6 shrink-0 rounded-sm border border-neutral-700/30 object-cover"
        }
        unoptimized
        onError={(e) => {
          const el = e.target as HTMLImageElement
          if (el) el.style.display = "none"
        }}
      />
    : null)

  return (
    <Link
      href={href}
      className={cn(
        "flex text-xs font-medium transition-colors",
        asideMediaLayout ?
          "items-stretch gap-0 p-0 text-white hover:opacity-100"
        : cn(
            "items-center gap-2 rounded-md p-2",
            "bg-wl-green/30 text-white hover:opacity-90",
          ),
        className,
      )}
    >
      {asideMediaLayout && artwork ?
        <span className="wl-home-v2-setlist-badge-art">{artwork}</span>
      : artwork}
      {asideMediaLayout ?
        <span className="wl-home-v2-setlist-badge-body">{children}</span>
      : children}
    </Link>
  )
}

export function CategoryCompleteBadge({
  categoryName,
  linkClassName,
}: {
  categoryName: string | null
  linkClassName?: string
}) {
  const { artwork, loaded } = useCategoryArtwork(categoryName)

  if (!categoryName?.trim()) return null

  return (
    <BadgeLink
      href={getListArchiveUrl(CATEGORY_LIST_ID)}
      imageSrc={loaded ? artwork : null}
      imageAlt={categoryName}
      className={linkClassName}
      asideMediaLayout={linkClassName?.includes("wl-home-v2-setlist-badge-link")}
    >
      <span className="leading-3">
        This show featured a full performance of{" "}
        <span className="setlist-badge-link-title font-semibold">
          {categoryName}
        </span>
        .
      </span>
    </BadgeLink>
  )
}

export function JiveCompleteBadge({
  showJiveComplete,
  linkClassName,
}: {
  showJiveComplete: boolean
  linkClassName?: string
}) {
  if (!showJiveComplete) return null

  return (
    <BadgeLink
      href={getListArchiveUrl(JIVE_LIST_ID)}
      imageAlt="Jive Suite"
      className={linkClassName}
      asideMediaLayout={linkClassName?.includes("wl-home-v2-setlist-badge-link")}
    >
      <span className="leading-3">
        This show featured a full performance of the{" "}
        <span className="underline decoration-neutral-900/50 transition-colors hover:decoration-neutral-900">
          Jive Suite
        </span>
        .
      </span>
    </BadgeLink>
  )
}

export function DripfieldCompleteBadge({
  showDripfieldComplete,
  linkClassName,
}: {
  showDripfieldComplete: boolean
  linkClassName?: string
}) {
  if (!showDripfieldComplete) return null

  return (
    <BadgeLink
      href={getListArchiveUrl(DRIPFIELD_LIST_ID)}
      imageSlot={
        <DripfieldRotatingArtwork
          className={
            linkClassName?.includes("wl-home-v2-setlist-badge-link") ?
              "wl-home-v2-setlist-badge-rotating-art"
            : undefined
          }
          imageSizes={
            linkClassName?.includes("wl-home-v2-setlist-badge-link") ?
              "40px"
            : undefined
          }
        />
      }
      imageAlt="Dripfield"
      className={linkClassName}
      asideMediaLayout={linkClassName?.includes("wl-home-v2-setlist-badge-link")}
    >
      <span className="leading-3">
        This show featured a full performance of the{" "}
        <span className="setlist-badge-link-title font-semibold">
          Dripfield Suite
        </span>
        .
      </span>
    </BadgeLink>
  )
}

interface SetlistBadgesCardProps {
  show: Show
}

export function SetlistBadgesCard({ show }: SetlistBadgesCardProps) {
  const hasCategory = !!show.show_listcategorycomplete
  const hasJive = show.show_jivecomplete === true
  const hasDripfield = show.show_dripfieldcomplete === true

  if (!hasCategory && !hasJive && !hasDripfield) return null

  return (
    <>
      {hasCategory && (
        <Card className="border-border/60 bg-card/80 py-0">
          <CardContent className="px-0">
            <CategoryCompleteBadge
              categoryName={show.show_listcategorycomplete ?? null}
            />
          </CardContent>
        </Card>
      )}
      {hasJive && (
        <Card className="border-border/60 bg-card/80 py-0">
          <CardContent className="px-0">
            <JiveCompleteBadge showJiveComplete />
          </CardContent>
        </Card>
      )}
      {hasDripfield && (
        <Card className="border-border/60 bg-card/80 py-0">
          <CardContent className="px-0">
            <DripfieldCompleteBadge showDripfieldComplete />
          </CardContent>
        </Card>
      )}
    </>
  )
}
