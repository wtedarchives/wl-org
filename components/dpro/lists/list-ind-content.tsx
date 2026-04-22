"use client"

import { useEffect } from "react"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { Card, CardContent } from "@/components/ui/card"
import {
  CategoryCompleteRotatingArtwork,
  DripfieldRotatingArtwork,
  JiveRotatingArtwork,
} from "@/components/dpro/rotating-bandcamp-artwork"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useListIndData } from "@/hooks/use-list-ind-data"
import { getListArchiveUrl } from "@/lib/list-archive-url"
import {
  ListContentLoadingProvider,
  useListContentLoading,
} from "./list-content-loading-context"
import { LongestPerformancesList } from "./longest-performances-list"
import { LongestShowsList } from "./longest-shows-list"
import { PopularPlacementsList } from "./popular-placements-list"
import { SeguesList } from "./segues-list"
import { UnfinishedReprisedList } from "./unfinished-reprised-list"
import { CategoryCompleteShowsList } from "./category-complete-shows-list"
import { JiveCompleteShowsList } from "./jive-complete-shows-list"
import { DripfieldCompleteShowsList } from "./dripfield-complete-shows-list"
import { DefaultListItems } from "./default-list-items"

interface ListIndContentProps {
  listId: string
}

function renderListContent(
  listType: string,
  listId: string,
  list: NonNullable<ReturnType<typeof useListIndData>["list"]>,
  items: ReturnType<typeof useListIndData>["items"],
) {
  switch (listType) {
    case "longest_performances":
      return <LongestPerformancesList listId={listId} isShortest={false} />
    case "shortest_performances":
      return <LongestPerformancesList listId={listId} isShortest />
    case "popular_placements":
      return <PopularPlacementsList listId={listId} />
    case "unfinished_reprised":
      return <UnfinishedReprisedList listId={listId} />
    case "segues":
      return <SeguesList listId={listId} />
    case "longest_shows":
      return <LongestShowsList />
    case "category_complete":
      return <CategoryCompleteShowsList />
    case "jive_complete":
      return <JiveCompleteShowsList />
    case "dripfield_complete":
      return <DripfieldCompleteShowsList />
    default:
      return (
        <DefaultListItems items={items} listCategory={list.list_category} />
      )
  }
}

function ListContentWithLoading({
  listType,
  listId,
  list,
  items,
}: {
  listType: string
  listId: string
  list: NonNullable<ReturnType<typeof useListIndData>["list"]>
  items: ReturnType<typeof useListIndData>["items"]
}) {
  const ctx = useListContentLoading()

  return (
    <>
      {ctx?.loading && (
        <LoadingPageCard message="Loading list…" progress={ctx.progress} />
      )}
      <div
        className={ctx?.loading ? "hidden" : ""}
        aria-hidden={!!ctx?.loading}
      >
        <div className="flex flex-1 flex-col gap-4 px-4 md:px-6 py-2 md:py-4 rounded-b-none md:rounded-b-xl overflow-hidden">
          <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
            <div className="border-b border-border/60 bg-muted/60 px-3 py-1 space-y-2">
              <div className="flex items-center gap-3">
                {listType === "dripfield_complete" && (
                  <DripfieldRotatingArtwork
                    className="size-8 shrink-0 border-border/60"
                    imageSizes="40px"
                  />
                )}
                {listType === "category_complete" && (
                  <CategoryCompleteRotatingArtwork
                    className="size-8 shrink-0 border-border/60"
                    imageSizes="40px"
                  />
                )}
                {listType === "jive_complete" && (
                  <JiveRotatingArtwork
                    className="size-8 shrink-0 border-border/60"
                    imageSizes="40px"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <h1 className="text-sm font-semibold">{list.list_name}</h1>
                </div>
              </div>
            </div>
            {list.list_description?.trim() && (
              <div className="px-3 py-2">
                <p className="text-xs leading-tight text-muted-foreground">
                  {list.list_description}
                </p>
              </div>
            )}
          </Card>

          {listType === "popular_placements" ||
          listType === "unfinished_reprised" ||
          listType === "segues" ? (
            renderListContent(listType, listId, list, items)
          ) : (
            <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
              <CardContent className="p-0">
                {renderListContent(listType, listId, list, items)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

export function ListIndContent({ listId }: ListIndContentProps) {
  const { list, items, loading, error } = useListIndData(listId)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()

  useEffect(() => {
    if (!list) return
    setSetlistBreadcrumbs([
      WTED_ARCHIVES_BREADCRUMB_ROOT,
      { label: "Lists", href: "/old/archive/lists" },
      { label: list.list_name, href: getListArchiveUrl(listId) },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [list, setSetlistBreadcrumbs])

  useEffect(() => {
    if (list) {
      document.title = `${list.list_name} – WysteriaLane.org`
      return () => {
        document.title = ""
      }
    }
  }, [list])

  if (loading) {
    return <LoadingPageCard message="Loading list…" />
  }

  if (error || !list) {
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
    return (
      <ListContentLoadingProvider initialLoading={true}>
        <ListContentWithLoading
          listType={listType}
          listId={listId}
          list={list}
          items={items}
        />
      </ListContentLoadingProvider>
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
