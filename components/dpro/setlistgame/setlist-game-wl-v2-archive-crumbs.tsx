"use client"

import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { type BreadcrumbItem } from "@/components/setlist-breadcrumb-context"

/** Inline trail for `/archive/setlistgame2` (WL v2 shell) — same chrome as archive setlist crumbs bar. */
export function SetlistGameWlV2ArchiveCrumbs({
  items,
}: {
  items: BreadcrumbItem[]
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  if (items.length === 0) return null
  return (
    <WlHomeV2ArchiveCrumbsShell
      variant="rail"
      bottomSpacing={false}
      trail={
        <WlHomeV2ArchiveCrumbsTrail
          items={items}
          openArchiveHub={openArchiveHub ?? undefined}
        />
      }
    />
  )
}
