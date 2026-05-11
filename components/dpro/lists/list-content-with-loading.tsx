"use client"

import {
  CategoryCompleteRotatingArtwork,
  DripfieldRotatingArtwork,
  JiveRotatingArtwork,
} from "@/components/dpro/rotating-bandcamp-artwork"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useListIndData } from "@/hooks/use-list-ind-data"
import { Card, CardContent } from "@/components/ui/card"

import { CategoryCompleteShowsList } from "./category-complete-shows-list"
import { DefaultListItems } from "./default-list-items"
import { DripfieldCompleteShowsList } from "./dripfield-complete-shows-list"
import { JiveCompleteShowsList } from "./jive-complete-shows-list"
import { useListContentLoading } from "./list-content-loading-context"
import { LongestPerformancesList } from "./longest-performances-list"
import { LongestShowsList } from "./longest-shows-list"
import { PopularPlacementsList } from "./popular-placements-list"
import { SeguesList } from "./segues-list"
import { UnfinishedReprisedList } from "./unfinished-reprised-list"

function renderListContent(
  listType: string,
  listId: string,
  list: NonNullable<ReturnType<typeof useListIndData>["list"]>,
  items: ReturnType<typeof useListIndData>["items"],
  archiveV2Lists: boolean,
) {
  switch (listType) {
    case "longest_performances":
      return (
        <LongestPerformancesList
          key={listId}
          listId={listId}
          listName={list.list_name}
          listDescription={list.list_description}
          isShortest={false}
        />
      )
    case "shortest_performances":
      return (
        <LongestPerformancesList
          key={listId}
          listId={listId}
          listName={list.list_name}
          listDescription={list.list_description}
          isShortest
        />
      )
    case "popular_placements":
      return (
        <PopularPlacementsList
          key={listId}
          listId={listId}
          listName={list.list_name}
          listDescription={list.list_description}
          wlHomeV2={archiveV2Lists}
        />
      )
    case "unfinished_reprised":
      return (
        <UnfinishedReprisedList
          key={listId}
          listId={listId}
          listName={list.list_name}
          listDescription={list.list_description}
          wlHomeV2={archiveV2Lists}
        />
      )
    case "segues":
      return <SeguesList key={listId} listId={listId} />
    case "longest_shows":
      return <LongestShowsList key={listId} />
    case "category_complete":
      return <CategoryCompleteShowsList key={listId} />
    case "jive_complete":
      return <JiveCompleteShowsList key={listId} />
    case "dripfield_complete":
      return <DripfieldCompleteShowsList key={listId} />
    default:
      return (
        <DefaultListItems
          key={listId}
          items={items}
          listCategory={list.list_category}
        />
      )
  }
}

export function ListContentWithLoading({
  listType,
  listId,
  list,
  items,
  archiveV2Lists,
}: {
  listType: string
  listId: string
  list: NonNullable<ReturnType<typeof useListIndData>["list"]>
  items: ReturnType<typeof useListIndData>["items"]
  archiveV2Lists: boolean
}) {
  const ctx = useListContentLoading()
  const isLongestPerformancesLayout =
    listType === "longest_performances" ||
    listType === "shortest_performances"
  const isSelfContainedV2ArchiveList =
    listType === "longest_performances" ||
    listType === "shortest_performances" ||
    listType === "popular_placements" ||
    listType === "unfinished_reprised"

  if (archiveV2Lists) {
    return (
      <>
        {ctx?.loading && (
          <WlHomeV2PageLoading message="Loading list…" />
        )}
        <div
          className={ctx?.loading ? "hidden" : "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"}
          aria-hidden={!!ctx?.loading}
        >
          {isSelfContainedV2ArchiveList ?
            renderListContent(listType, listId, list, items, archiveV2Lists)
          : <>
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
                      <h1 className="text-sm font-semibold">
                        {list.list_name}
                      </h1>
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

              {listType === "segues" ?
                renderListContent(listType, listId, list, items, archiveV2Lists)
              : <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
                  <CardContent className="p-0">
                    {renderListContent(listType, listId, list, items, archiveV2Lists)}
                  </CardContent>
                </Card>
              }
            </>
          }
        </div>
      </>
    )
  }

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
          {isLongestPerformancesLayout ?
            renderListContent(listType, listId, list, items, archiveV2Lists)
          : <>
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
                renderListContent(listType, listId, list, items, archiveV2Lists)
              ) : (
                <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
                  <CardContent className="p-0">
                    {renderListContent(listType, listId, list, items, archiveV2Lists)}
                  </CardContent>
                </Card>
              )}
            </>
          }
        </div>
      </div>
    </>
  )
}
