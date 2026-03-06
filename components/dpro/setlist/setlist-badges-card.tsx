"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useCategoryArtwork } from "@/hooks/use-category-artwork"
import type { Show } from "@/types/setlist"
import { cn } from "@/lib/utils"

const CATEGORY_LIST_ID = "81dbe56c-7cc4-466b-b8d7-47c1ca041afc"
const JIVE_LIST_ID = "c66cfb55-12a8-4cfe-9147-547d9e6c1736"
const DRIPFIELD_LIST_ID = "6b47d70f-202b-45fe-a5b1-203c031c6aad"

const JIVE_ARTWORK = "https://f4.bcbits.com/img/a2223100564_16.jpg"
const DRIPFIELD_ARTWORK = "https://f4.bcbits.com/img/a0238290447_16.jpg"

function BadgeLink({
  href,
  imageSrc,
  imageAlt,
  children,
  className,
}: {
  href: string
  imageSrc?: string | null
  imageAlt: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md p-2 text-xs font-medium transition-colors",
        "bg-wl-green/30 text-white hover:opacity-90",
        className
      )}
    >
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={20}
          height={20}
          className="size-6 shrink-0 rounded-sm object-cover border border-neutral-700/30"
          unoptimized
          onError={(e) => {
            const el = e.target as HTMLImageElement
            if (el) el.style.display = "none"
          }}
        />
      )}
      {children}
    </Link>
  )
}

function CategoryCompleteBadge({ categoryName }: { categoryName: string | null }) {
  const { artwork, loaded } = useCategoryArtwork(categoryName)

  if (!categoryName?.trim()) return null

  return (
    <BadgeLink
      href={`/dpro/lists/${CATEGORY_LIST_ID}`}
      imageSrc={loaded ? artwork : null}
      imageAlt={categoryName}
    >
      <span className="leading-3">
        This show featured a full performance of{" "}
        <span className="underline decoration-neutral-900/50 underline-offset-1 transition-colors hover:decoration-neutral-900">
          {categoryName}
        </span>
        .
      </span>
    </BadgeLink>
  )
}

function JiveCompleteBadge({ showJiveComplete }: { showJiveComplete: boolean }) {
  if (!showJiveComplete) return null

  return (
    <BadgeLink href={`/dpro/lists/${JIVE_LIST_ID}`} imageSrc={JIVE_ARTWORK} imageAlt="Jive Suite">
      <span className="leading-3">
        This show featured a full performance of the{" "}
        <span className="underline decoration-neutral-900/50 underline-offset-1 transition-colors hover:decoration-neutral-900">
          Jive Suite
        </span>
        .
      </span>
    </BadgeLink>
  )
}

function DripfieldCompleteBadge({
  showDripfieldComplete,
}: {
  showDripfieldComplete: boolean
}) {
  if (!showDripfieldComplete) return null

  return (
    <BadgeLink
      href={`/dpro/lists/${DRIPFIELD_LIST_ID}`}
      imageSrc={DRIPFIELD_ARTWORK}
      imageAlt="Dripfield"
    >
      <span className="leading-3">
        This show featured a full performance of the{" "}
        <span className="underline decoration-neutral-900/50 underline-offset-1 transition-colors hover:decoration-neutral-900">
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
            <CategoryCompleteBadge categoryName={show.show_listcategorycomplete ?? null} />
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
