"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { useListIndData } from "@/hooks/use-list-ind-data"
import { getListArchiveUrl } from "@/lib/list-archive-url"

import { DefaultListItems } from "./default-list-items"
import { ListContentLoadingProvider } from "./list-content-loading-context"
import { ListContentWithLoading } from "./list-content-with-loading"
import { ListIndArchiveV2Shell } from "./list-ind-archive-v2-shell"

import "@/components/archive-songs/songs-archive-verbatim.css"

interface ListIndContentProps {
  listId: string
}

export function ListIndContent({ listId }: ListIndContentProps) {
  const pathname = usePathname()
  const archiveV2Lists = pathname === "/archive/lists"
  const { list, items, loading, error } = useListIndData(listId)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const listsIndexHref =
    pathname === "/archive/lists" ? "/archive/lists" : "/old/archive/lists"
  const archiveRoot =
    pathname === "/archive/lists"
      ? WL_V2_ARCHIVES_BREADCRUMB_ROOT
      : WTED_ARCHIVES_BREADCRUMB_ROOT

  useEffect(() => {
    if (!list) return
    setSetlistBreadcrumbs([
      archiveRoot,
      { label: "Lists", href: listsIndexHref },
      { label: list.list_name, href: getListArchiveUrl(listId) },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [
    archiveRoot,
    list,
    listId,
    listsIndexHref,
    setSetlistBreadcrumbs,
  ])

  useEffect(() => {
    if (list) {
      document.title = `${list.list_name} – WysteriaLane.org`
      return () => {
        document.title = ""
      }
    }
  }, [list])

  if (loading) {
    return archiveV2Lists ?
        <WlHomeV2PageLoading message="Loading list…" />
      : <LoadingPageCard message="Loading list…" />
  }

  if (error || !list) {
    if (archiveV2Lists) {
      return (
        <ListIndArchiveV2Shell listName="Not found" listId={listId}>
          <div className="flex flex-1 items-center justify-center py-12">
            <p className="text-center text-sm text-white/65">
              {error ?? "List not found."}
            </p>
          </div>
        </ListIndArchiveV2Shell>
      )
    }
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 md:px-6 py-2 md:py-4 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            {error ?? "List not found."}
          </p>
        </div>
      </div>
    )
  }

  const listType = list.list_type ?? "default"

  const FETCH_HEAVY_TYPES = [
    "longest_performances",
    "shortest_performances",
    "popular_placements",
    "unfinished_reprised",
    "segues",
    "longest_shows",
    "category_complete",
    "jive_complete",
    "dripfield_complete",
  ] as const
  const needsContentFetch = FETCH_HEAVY_TYPES.includes(
    listType as (typeof FETCH_HEAVY_TYPES)[number],
  )

  if (needsContentFetch) {
    const heavy = (
      <ListContentLoadingProvider key={listId} initialLoading={true}>
        <ListContentWithLoading
          listType={listType}
          listId={listId}
          list={list}
          items={items}
          archiveV2Lists={archiveV2Lists}
        />
      </ListContentLoadingProvider>
    )
    if (archiveV2Lists) {
      return (
        <ListIndArchiveV2Shell listName={list.list_name} listId={listId}>
          {heavy}
        </ListIndArchiveV2Shell>
      )
    }
    return heavy
  }

  if (archiveV2Lists) {
    return (
      <ListIndArchiveV2Shell listName={list.list_name} listId={listId}>
        <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
          <div className="border-b border-border/60 bg-muted/60 px-3 py-1 space-y-2">
            <h1 className="text-sm font-semibold">{list.list_name}</h1>
          </div>
          {list.list_description?.trim() && (
            <div className="px-3 py-2">
              <p className="text-xs leading-tight text-muted-foreground">
                {list.list_description}
              </p>
            </div>
          )}
        </Card>

        <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
          <CardContent className="p-0">
            <DefaultListItems
              items={items}
              listCategory={list.list_category}
            />
          </CardContent>
        </Card>
      </ListIndArchiveV2Shell>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 md:px-6 py-2 md:py-4 rounded-b-none md:rounded-b-xl overflow-hidden">
      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <div className="border-b border-border/60 bg-muted/60 px-3 py-1 space-y-2">
          <h1 className="text-sm font-semibold">{list.list_name}</h1>
        </div>
        {list.list_description?.trim() && (
          <div className="px-3 py-2">
            <p className="text-xs leading-tight text-muted-foreground">
              {list.list_description}
            </p>
          </div>
        )}
      </Card>

      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardContent className="p-0">
          <DefaultListItems
            items={items}
            listCategory={list.list_category}
          />
        </CardContent>
      </Card>
    </div>
  )
}
