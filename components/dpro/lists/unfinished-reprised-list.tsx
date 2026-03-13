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
import { useUnfinishedReprisedData } from "@/hooks/use-unfinished-reprised-data"
import { RepriseSandwichPerformancesDrawer } from "./reprise-sandwich-performances-drawer"
import { useListContentLoading } from "./list-content-loading-context"
import type { SandwichRow } from "@/hooks/use-unfinished-reprised-data"

const COVER_SONGS_HEADER_IMAGE =
  "https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg"

interface UnfinishedReprisedListProps {
  listId: string
}

export function UnfinishedReprisedList({ listId }: UnfinishedReprisedListProps) {
  const { unfinished, sandwiches, loading, error, progress } =
    useUnfinishedReprisedData()
  const ctx = useListContentLoading()
  const [sandwichDrawerOpen, setSandwichDrawerOpen] = useState(false)
  const [drawerSandwich, setDrawerSandwich] = useState<SandwichRow | null>(null)

  useEffect(() => {
    ctx?.setLoading(loading)
  }, [loading, ctx])
  useEffect(() => {
    ctx?.setProgress(progress)
  }, [progress, ctx])

  if (loading) return null

  if (error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Most Common Unfinished */}
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
                          href={`/archive/song/${row.song_id}`}
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
                          <img
                            src={row.category_artwork}
                            alt=""
                            width={20}
                            height={20}
                            className="mx-auto size-5 shrink-0 aspect-square rounded object-cover border border-border"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display =
                                "none"
                            }}
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

      {/* Most Common Reprises (sandwiches) */}
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
                            <span key={s.song_id}>
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

      <RepriseSandwichPerformancesDrawer
        open={sandwichDrawerOpen}
        onOpenChange={setSandwichDrawerOpen}
        sandwich={drawerSandwich}
      />
    </div>
  )
}
