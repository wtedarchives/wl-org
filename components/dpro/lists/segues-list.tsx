"use client"

import { useState, useEffect, Fragment } from "react"
import Image from "next/image"
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react"
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
import { useSeguesData } from "@/hooks/use-segues-data"
import { SeguePerformancesDrawer } from "./segue-performances-drawer"
import { useListContentLoading } from "./list-content-loading-context"
import type { SegueSourceRow, SegueDestination } from "@/hooks/use-segues-data"

const COVER_SONGS_HEADER_IMAGE =
  "https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg"

function SeguesRowCategoryThumb({ src }: { src: string }) {
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

interface SeguesListProps {
  listId: string
}

export function SeguesList({ listId }: SeguesListProps) {
  const { segues, loading, error, progress } = useSeguesData()
  const ctx = useListContentLoading()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerSegue, setDrawerSegue] = useState<{
    sourceSong: string
    sourceDisplayName: string | null
    destSong: string
    destDisplayName: string | null
  } | null>(null)

  const openDrawer = (source: SegueSourceRow, dest: SegueDestination) => {
    setDrawerSegue({
      sourceSong: source.song_name,
      sourceDisplayName: source.song_displayname,
      destSong: dest.song_name,
      destDisplayName: dest.song_displayname,
    })
    setDrawerOpen(true)
  }

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

  if (segues.length === 0) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        No segues found.
      </div>
    )
  }

  return (
    <>
      <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="bg-muted/60 px-3 py-2 text-sm font-medium space-y-1">
          <h2 className="font-medium">Most Common Segues</h2>
          <p className="text-xs text-muted-foreground font-normal">
            Songs that segued into another song, ordered by frequency.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full text-xs">
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
                  <TableHead className="w-8 px-2 py-0.5 text-center text-xs font-medium" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {segues.map((row, i) => {
                  const displayRank =
                    i === 0 || segues[i].count !== segues[i - 1].count
                      ? i + 1
                      : null
                  const isExpanded = expandedId === row.song_id
                  return (
                    <Fragment key={row.song_id}>
                      <TableRow
                        key={row.song_id}
                        className={`cursor-pointer ${
                          i % 2 === 0 ? "bg-background/70" : "bg-background"
                        } hover:bg-muted/40`}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : row.song_id)
                        }
                      >
                        <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums align-middle">
                          {displayRank ?? ""}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 align-middle">
                          <span className="font-medium">
                            <SongDisplayName
                              song={row.song_name}
                              songDisplayName={row.song_displayname}
                            />
                          </span>
                        </TableCell>
                        <TableCell className="min-w-16 w-16 px-2 py-0.5 text-center align-middle">
                          {row.category_artwork ? (
                            <SeguesRowCategoryThumb src={row.category_artwork} />
                          ) : null}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-center text-xs tabular-nums align-middle">
                          {row.count}
                        </TableCell>
                        <TableCell className="w-8 px-2 py-0.5 text-center align-middle">
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground inline-block" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground inline-block" />
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded &&
                        row.destinations.map((dest) => (
                          <TableRow
                            key={`${row.song_id}-${dest.song_id}`}
                            className={
                              i % 2 === 0 ? "bg-background/70" : "bg-background"
                            }
                          >
                            <TableCell className="w-8 px-2 py-0.5 align-middle" />
                            <TableCell className="px-2 py-0.5 align-middle">
                              <div className="flex items-center gap-1.5">
                                <ArrowRight className="size-3.5 shrink-0 text-destructive" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openDrawer(row, dest)
                                  }}
                                  className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded text-left text-xs"
                                >
                                  <SongDisplayName
                                    song={dest.song_name}
                                    songDisplayName={dest.song_displayname}
                                  />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-16 w-16 px-2 py-0.5 text-center align-middle">
                              {dest.category_artwork ? (
                                <SeguesRowCategoryThumb
                                  src={dest.category_artwork}
                                />
                              ) : null}
                            </TableCell>
                            <TableCell className="w-16 px-2 py-0.5 text-center text-xs tabular-nums align-middle">
                              {dest.count}
                            </TableCell>
                            <TableCell className="w-8 px-2 py-0.5 align-middle" />
                          </TableRow>
                        ))}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SeguePerformancesDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        sourceSong={drawerSegue?.sourceSong ?? null}
        sourceDisplayName={drawerSegue?.sourceDisplayName ?? null}
        destSong={drawerSegue?.destSong ?? null}
        destDisplayName={drawerSegue?.destDisplayName ?? null}
      />
    </>
  )
}
