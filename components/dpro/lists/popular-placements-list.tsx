"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  getTopSlotsCategoryClassName,
  WlTopSlotsCategorySwatch,
} from "@/components/dpro/tours/top-slots-carousel"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  usePopularPlacementsData,
  type PlacementRow,
} from "@/hooks/use-popular-placements-data"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { cn } from "@/lib/utils"

import { useListContentLoading } from "./list-content-loading-context"

interface PopularPlacementsListProps {
  listId: string
  listName?: string
  listDescription?: string | null
  wlHomeV2?: boolean
}

const SECTIONS = [
  {
    title: "Top Show Openers",
    slotTitle: "Show Openers",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.showOpeners,
  },
  {
    title: "Top Set Openers",
    slotTitle: "Set Openers",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.setOpeners,
  },
  {
    title: "Top Set Closers",
    slotTitle: "Set Closers",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.setClosers,
  },
  {
    title: "Top Encores",
    slotTitle: "Encores",
    getItems: (d: ReturnType<typeof usePopularPlacementsData>) =>
      d.encores,
  },
] as const

type Section = (typeof SECTIONS)[number]

function PopularPlacementsCategoryThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <span className="inline-flex shrink-0 items-center !pr-2">
      <img
        src={src}
        alt=""
        className="size-5 shrink-0 rounded border border-[rgb(63,65,64)] object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

function PopularPlacementsLegacyCardCategoryThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className="mx-auto size-5 shrink-0 aspect-square rounded object-cover border border-border"
      onError={() => setFailed(true)}
    />
  )
}

function PopularPlacementsWlSectionTable({
  section,
  sectionIndex,
  items,
}: {
  section: Section
  sectionIndex: number
  items: PlacementRow[]
}) {
  if (items.length === 0) {
    return (
      <div className="widget-panel w-full min-w-0 flex-1">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">{section.title}</span>
          <div className="wp-head-right">
            <WlTopSlotsCategorySwatch
              title={section.slotTitle}
              index={sectionIndex}
            />
          </div>
        </div>
        <div className="px-3 py-2 text-xs text-white/55">No data</div>
      </div>
    )
  }

  return (
    <div className="widget-panel w-full min-w-0 flex-1">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">{section.title}</span>
        <div className="wp-head-right">
          <WlTopSlotsCategorySwatch
            title={section.slotTitle}
            index={sectionIndex}
          />
        </div>
      </div>
      <div className="min-w-0">
        <table
          className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
        >
          <tbody>
            {items.map((row, i) => {
              const displayRank =
                i === 0 ||
                items[i].times_played !== items[i - 1].times_played
                  ? i + 1
                  : null
              return (
                <tr
                  key={row.song_id}
                  className={cn(
                    "transition-colors",
                    "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0",
                  )}
                >
                  <td className="wl-home-v2-top-slots-stats-cell">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {displayRank != null ?
                          <span
                            className="w-4 shrink-0 text-right text-[10px] tabular-nums text-white/55"
                            aria-hidden
                          >
                            {displayRank}
                          </span>
                        : <span className="w-4 shrink-0" aria-hidden />}
                        <Link
                          href={getSongArchiveUrl(row.song_id)}
                          className="min-w-0 cursor-pointer text-left font-medium text-white/88 hover:underline"
                        >
                          <SongDisplayName
                            song={row.song_name}
                            songDisplayName={row.song_displayname}
                          />
                        </Link>
                      </div>
                      {row.category_artwork ?
                        <PopularPlacementsCategoryThumb
                          src={row.category_artwork}
                        />
                      : null}
                    </div>
                  </td>
                  <td
                    className={cn(
                      "w-[30px] min-w-[30px] text-center font-medium tabular-nums",
                      "wl-home-v2-top-slots-stats-cell text-white/88",
                    )}
                  >
                    {row.times_played}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PopularPlacementsWlArchiveBody({
  listName,
  listDescription,
  sectionModels,
}: {
  listName: string
  listDescription?: string | null
  sectionModels: { section: Section; index: number; items: PlacementRow[] }[]
}) {
  const desc = listDescription?.trim() ?? ""
  const sectionsWithData = sectionModels.filter((s) => s.items.length > 0)
  const [mobileIndex, setMobileIndex] = useState(0)
  const safeMobileIndex =
    sectionsWithData.length > 0 ?
      Math.min(mobileIndex, sectionsWithData.length - 1)
    : 0
  const currentMobile =
    sectionsWithData[safeMobileIndex] ?? sectionModels[0] ?? null

  return (
    <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
      <section className="wl-home-v2-popular-placements-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div className="show-header">
            <div className="left">
              <div className="show-header-title-row">
                <h1 className="show-header-heading">
                  <span className="date">{listName}</span>
                </h1>
              </div>
              {desc ?
                <div className="venue wl-home-v2-list-header-desc">
                  <span className="venue-subvenue-text">{desc}</span>
                </div>
              : null}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
            <div className="xl:hidden">
              <div className="widget-panel w-full min-w-0 shrink-0">
                <div className="wp-head wl-home-v2-years-shows-wp-head">
                  <span className="min-w-0 truncate">Top Slots</span>
                  <div className="wp-head-right">
                    {sectionsWithData.length > 1 ?
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "wl-home-v2-top-slots-mobile-dd-trigger shrink-0 gap-1 rounded-[4px] border border-black/25 !h-auto min-h-0",
                              "!py-px !pl-2 !pr-1.5",
                              "font-mono text-[10px] !font-normal uppercase leading-normal tracking-[0.08em]",
                              "text-white/[0.90] shadow-none hover:text-white/[0.78]",
                              currentMobile ?
                                getTopSlotsCategoryClassName(
                                  currentMobile.section.slotTitle,
                                  currentMobile.index,
                                )
                              : "wl-home-v2-top-slots-cat--fallback",
                            )}
                          >
                            {currentMobile?.section.title ?? ""}
                            <ChevronDown
                              className="ml-0.5 size-2.5 shrink-0 opacity-70"
                              aria-hidden
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {sectionsWithData.map((entry, i) => (
                            <DropdownMenuItem
                              key={entry.section.title}
                              onClick={() => setMobileIndex(i)}
                            >
                              {entry.section.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    : null}
                    {currentMobile ?
                      <WlTopSlotsCategorySwatch
                        title={currentMobile.section.slotTitle}
                        index={currentMobile.index}
                      />
                    : null}
                  </div>
                </div>
                <div className="min-w-0">
                  {currentMobile ?
                    <table
                      className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
                    >
                      <tbody>
                        {currentMobile.items.length === 0 ?
                          <tr>
                            <td className="px-3 py-2 text-xs text-white/55">
                              No data
                            </td>
                          </tr>
                        : currentMobile.items.map((row, i) => {
                            const items = currentMobile.items
                            const displayRank =
                              i === 0 ||
                              items[i].times_played !== items[i - 1].times_played
                                ? i + 1
                                : null
                            return (
                              <tr
                                key={row.song_id}
                                className={cn(
                                  "transition-colors",
                                  "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0",
                                )}
                              >
                                <td className="wl-home-v2-top-slots-stats-cell">
                                  <div className="flex min-w-0 items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      {displayRank != null ?
                                        <span
                                          className="w-4 shrink-0 text-right text-[10px] tabular-nums text-white/55"
                                          aria-hidden
                                        >
                                          {displayRank}
                                        </span>
                                      : <span className="w-4 shrink-0" aria-hidden />}
                                      <Link
                                        href={getSongArchiveUrl(row.song_id)}
                                        className="min-w-0 cursor-pointer text-left font-medium text-white/88 hover:underline"
                                      >
                                        <SongDisplayName
                                          song={row.song_name}
                                          songDisplayName={row.song_displayname}
                                        />
                                      </Link>
                                    </div>
                                    {row.category_artwork ?
                                      <PopularPlacementsCategoryThumb
                                        src={row.category_artwork}
                                      />
                                    : null}
                                  </div>
                                </td>
                                <td
                                  className={cn(
                                    "w-[30px] min-w-[30px] text-center font-medium tabular-nums",
                                    "wl-home-v2-top-slots-stats-cell text-white/88",
                                  )}
                                >
                                  {row.times_played}
                                </td>
                              </tr>
                            )
                          })
                        }
                      </tbody>
                    </table>
                  : null}
                </div>
              </div>
            </div>

            <div className="hidden min-h-0 flex-1 xl:flex xl:flex-row xl:gap-4">
              {sectionModels.map(({ section, index, items }) => (
                <PopularPlacementsWlSectionTable
                  key={section.title}
                  section={section}
                  sectionIndex={index}
                  items={items}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export function PopularPlacementsList({
  listId: listIdProp,
  listName,
  listDescription,
  wlHomeV2 = false,
}: PopularPlacementsListProps) {
  void listIdProp
  const data = usePopularPlacementsData()
  const ctx = useListContentLoading()
  const setListContentLoading = ctx?.setLoading
  const setListContentProgress = ctx?.setProgress

  useEffect(() => {
    setListContentLoading?.(data.loading)
  }, [data.loading, setListContentLoading])
  useEffect(() => {
    setListContentProgress?.(data.progress ?? 0)
  }, [data.progress, setListContentProgress])

  if (data.loading) return null

  if (data.error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {data.error}
      </div>
    )
  }

  const sectionModels = SECTIONS.map((section, index) => ({
    section,
    index,
    items: section.getItems(data),
  }))

  if (wlHomeV2 && listName) {
    return (
      <PopularPlacementsWlArchiveBody
        listName={listName}
        listDescription={listDescription}
        sectionModels={sectionModels}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {SECTIONS.map((section) => {
        const items = section.getItems(data)
        return (
          <Card
            key={section.title}
            className="border-border/60 bg-card/80 overflow-hidden py-0"
          >
            <CardHeader
              className={cn(
                "px-3 py-2 text-sm font-medium text-white",
                section.slotTitle === "Show Openers" && "bg-[#047857]",
                section.slotTitle === "Set Openers" && "bg-[#10b981]",
                section.slotTitle === "Set Closers" && "bg-[#3b82f6]",
                section.slotTitle === "Encores" && "bg-[#be123c]",
              )}
            >
              {section.title}
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No data
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-8 px-2 py-0.5 text-center text-xs font-medium">
                        #
                      </TableHead>
                      <TableHead className="px-2 py-0.5 text-left text-xs font-medium">
                        Song
                      </TableHead>
                      <TableHead className="min-w-16 w-16 px-2 py-0.5 text-center text-xs font-medium">
                        Cat.
                      </TableHead>
                      <TableHead className="w-16 px-2 py-0.5 text-center text-xs font-medium">
                        Count
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row, i) => {
                      const displayRank =
                        i === 0 ||
                        items[i].times_played !== items[i - 1].times_played
                          ? i + 1
                          : null
                      return (
                        <TableRow
                          key={row.song_id}
                          className={
                            i % 2 === 0 ? "bg-background/70" : "bg-background"
                          }
                        >
                          <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums">
                            {displayRank ?? ""}
                          </TableCell>
                          <TableCell className="px-2 py-0.5">
                            <Link
                              href={getSongArchiveUrl(row.song_id)}
                              className="font-medium hover:underline"
                            >
                              <SongDisplayName
                                song={row.song_name}
                                songDisplayName={row.song_displayname}
                              />
                            </Link>
                          </TableCell>
                          <TableCell className="min-w-16 w-16 px-2 py-0.5 text-center align-middle">
                            {row.category_artwork ?
                              <PopularPlacementsLegacyCardCategoryThumb
                                src={row.category_artwork}
                              />
                            : null}
                          </TableCell>
                          <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums">
                            {row.times_played}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
