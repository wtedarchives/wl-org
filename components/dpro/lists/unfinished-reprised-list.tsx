"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { cn } from "@/lib/utils"
import { useUnfinishedReprisedData } from "@/hooks/use-unfinished-reprised-data"
import { WlHomeV2RepriseSandwichModal } from "@/components/wl-home-v2/wl-home-v2-reprise-sandwich-modal"
import { useListContentLoading } from "./list-content-loading-context"
import type { SandwichRow, UnfinishedRow } from "@/hooks/use-unfinished-reprised-data"

const COVER_SONGS_HEADER_IMAGE =
  "https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg"

interface UnfinishedReprisedListProps {
  listId: string
  listName?: string
  listDescription?: string | null
  wlHomeV2?: boolean
}

function UnfinishedReprisedCategoryThumb({ src }: { src: string }) {
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

function UnfinishedLegacyListCategoryThumb({ src }: { src: string }) {
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

function UnfinishedWlPanel({ rows }: { rows: UnfinishedRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="widget-panel w-full min-w-0 flex-1">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">Most Common Unfinished</span>
        </div>
        <div className="px-3 py-2 text-xs text-white/55">No data</div>
      </div>
    )
  }

  return (
    <div className="widget-panel w-full min-w-0 flex-1">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">Most Common Unfinished</span>
      </div>
      <div className="min-w-0">
        <table
          className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
        >
          <tbody>
            {rows.map((row, i) => {
              const displayRank =
                i === 0 || rows[i].count !== rows[i - 1].count ? i + 1 : null
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
                        <UnfinishedReprisedCategoryThumb
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
                    {row.count}
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

function ReprisesWlPanel({
  rows,
  onSandwichClick,
}: {
  rows: SandwichRow[]
  onSandwichClick: (row: SandwichRow) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="widget-panel w-full min-w-0 flex-1">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">Most Common Reprises</span>
        </div>
        <div className="px-3 py-2 text-xs text-white/55">No data</div>
      </div>
    )
  }

  return (
    <div className="widget-panel w-full min-w-0 flex-1">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">Most Common Reprises</span>
      </div>
      <div className="min-w-0">
        <table
          className="wl-home-v2-unfinished-reprised-reprises-table w-full min-w-max border-collapse text-[11px] wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
        >
          <tbody>
            {rows.map((row, i) => {
              const displayRank =
                i === 0 || rows[i].count !== rows[i - 1].count ? i + 1 : null
              return (
                <tr
                  key={row.songs.map((s) => s.song_id).join("|")}
                  className={cn(
                    "wl-home-v2-unfinished-reprised-reprises-row transition-colors",
                    "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0",
                  )}
                >
                  <td className="wl-home-v2-top-slots-stats-cell">
                    <div className="flex max-h-[22.5px] min-h-0 min-w-0 items-center gap-1.5 overflow-hidden">
                      {displayRank != null ?
                        <span
                          className="w-4 shrink-0 text-right text-[10px] tabular-nums text-white/55"
                          aria-hidden
                        >
                          {displayRank}
                        </span>
                      : <span className="w-4 shrink-0" aria-hidden />}
                      <button
                        type="button"
                        onClick={() => onSandwichClick(row)}
                        className="min-w-0 max-w-full cursor-pointer truncate text-left font-medium text-white/88 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded"
                      >
                        {row.songs.map((s, j) => (
                          <span key={`${s.song_id}-${j}`}>
                            {j > 0 && (
                              <span className="text-destructive"> → </span>
                            )}
                            <SongDisplayName
                              song={s.song_name}
                              songDisplayName={s.song_displayname}
                            />
                          </span>
                        ))}
                      </button>
                    </div>
                  </td>
                  <td
                    className={cn(
                      "w-[30px] min-w-[30px] text-center font-medium tabular-nums",
                      "wl-home-v2-top-slots-stats-cell text-white/88",
                    )}
                  >
                    {row.count}
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

function UnfinishedReprisedWlArchiveBody({
  listName,
  listDescription,
  unfinished,
  sandwiches,
  onSandwichClick,
}: {
  listName: string
  listDescription?: string | null
  unfinished: UnfinishedRow[]
  sandwiches: SandwichRow[]
  onSandwichClick: (row: SandwichRow) => void
}) {
  const desc = listDescription?.trim() ?? ""

  return (
    <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
      <section className="wl-home-v2-unfinished-reprised-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
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

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:gap-4">
            <UnfinishedWlPanel rows={unfinished} />
            <ReprisesWlPanel rows={sandwiches} onSandwichClick={onSandwichClick} />
          </div>
        </div>
      </section>
    </div>
  )
}

export function UnfinishedReprisedList({
  listId: listIdProp,
  listName,
  listDescription,
  wlHomeV2 = false,
}: UnfinishedReprisedListProps) {
  void listIdProp
  const { unfinished, sandwiches, loading, error, progress } =
    useUnfinishedReprisedData()
  const ctx = useListContentLoading()
  const [sandwichDrawerOpen, setSandwichDrawerOpen] = useState(false)
  const [drawerSandwich, setDrawerSandwich] = useState<SandwichRow | null>(null)

  const setListContentLoading = ctx?.setLoading
  const setListContentProgress = ctx?.setProgress

  useEffect(() => {
    setListContentLoading?.(loading)
  }, [loading, setListContentLoading])
  useEffect(() => {
    setListContentProgress?.(progress)
  }, [progress, setListContentProgress])

  if (loading) return null

  if (error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  const openSandwich = (row: SandwichRow) => {
    setDrawerSandwich(row)
    setSandwichDrawerOpen(true)
  }

  const sandwichModal = (
    <WlHomeV2RepriseSandwichModal
      open={sandwichDrawerOpen}
      onClose={() => setSandwichDrawerOpen(false)}
      sandwich={drawerSandwich}
    />
  )

  if (wlHomeV2 && listName) {
    return (
      <>
        <UnfinishedReprisedWlArchiveBody
          listName={listName}
          listDescription={listDescription}
          unfinished={unfinished}
          sandwiches={sandwiches}
          onSandwichClick={openSandwich}
        />
        {sandwichModal}
      </>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="bg-muted/60 px-3 py-2 text-sm font-medium">
          Most Common Unfinished
        </CardHeader>
        <CardContent className="p-0">
          {unfinished.length === 0 ? (
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
                    <Image
                      src={COVER_SONGS_HEADER_IMAGE}
                      alt="Cover Songs"
                      width={32}
                      height={32}
                      className="mx-auto size-8 rounded object-cover border border-border"
                      unoptimized
                    />
                  </TableHead>
                  <TableHead className="w-16 px-2 py-0.5 text-center text-xs font-medium">
                    Count
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unfinished.map((row, i) => {
                  const displayRank =
                    i === 0 || unfinished[i].count !== unfinished[i - 1].count
                      ? i + 1
                      : null
                  return (
                    <TableRow
                      key={row.song_id}
                      className={
                        i % 2 === 0 ? "bg-background/70" : "bg-background"
                      }
                    >
                      <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums align-middle">
                        {displayRank ?? ""}
                      </TableCell>
                      <TableCell className="px-2 py-0.5 align-middle">
                        <Link
                          href={getSongArchiveUrl(row.song_id)}
                          className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded"
                        >
                          <SongDisplayName
                            song={row.song_name}
                            songDisplayName={row.song_displayname}
                          />
                        </Link>
                      </TableCell>
                      <TableCell className="min-w-16 w-16 px-2 py-0.5 text-center align-middle">
                        {row.category_artwork ? (
                          <UnfinishedLegacyListCategoryThumb
                            src={row.category_artwork}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums align-middle">
                        {row.count}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="bg-muted/60 px-3 py-2 text-sm font-medium">
          Most Common Reprises
        </CardHeader>
        <CardContent className="p-0">
          {sandwiches.length === 0 ? (
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
                    Sandwich
                  </TableHead>
                  <TableHead className="w-16 px-2 py-0.5 text-center text-xs font-medium">
                    Count
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sandwiches.map((row, i) => {
                  const displayRank =
                    i === 0 || sandwiches[i].count !== sandwiches[i - 1].count
                      ? i + 1
                      : null
                  return (
                    <TableRow
                      key={row.songs.map((s) => s.song_id).join("|")}
                      className={
                        i % 2 === 0 ? "bg-background/70" : "bg-background"
                      }
                    >
                      <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums align-middle">
                        {displayRank ?? ""}
                      </TableCell>
                      <TableCell className="px-2 py-0.5 align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerSandwich(row)
                            setSandwichDrawerOpen(true)
                          }}
                          className="text-left font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded"
                        >
                          {row.songs.map((s, j) => (
                            <span key={`${s.song_id}-${j}`}>
                              {j > 0 && (
                                <span className="text-destructive"> → </span>
                              )}
                              <SongDisplayName
                                song={s.song_name}
                                songDisplayName={s.song_displayname}
                              />
                            </span>
                          ))}
                        </button>
                      </TableCell>
                      <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums align-middle">
                        {row.count}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {sandwichModal}
    </div>
  )
}
