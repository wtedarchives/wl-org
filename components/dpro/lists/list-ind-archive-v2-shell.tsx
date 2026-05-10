"use client"

import type { ReactNode } from "react"

import { getListsArchiveDetailBreadcrumbs } from "@/components/archive-lists/wl-home-v2-lists-archive-view-config"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"

export function ListIndArchiveV2Shell({
  listName,
  listId,
  children,
}: {
  listName: string
  listId: string
  children: ReactNode
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={getListsArchiveDetailBreadcrumbs(listName, listId)}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  )
}
